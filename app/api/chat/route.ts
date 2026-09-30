import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db';
import { encryptUserMessage, decryptUserMessage } from '@/lib/encryption';
import { evaluateSafety } from '@/lib/safety';
import { recordAuditLog } from '@/lib/audit';
import { anthropic, HUSHLEE_SYSTEM_PROMPT, HUSHLEE_SAFETY_SYSTEM_PROMPT } from '@/lib/claude';

export const runtime = 'nodejs'; // Full Node.js runtime for crypto & streaming

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    // Check mandatory retention policy consent
    if (!user.consentBackupAckAt) {
      return NextResponse.json(
        { error: 'Explicit consent to Hushlee retention policy required before chatting.' },
        { status: 403 }
      );
    }

    const { message, conversationId } = await req.json();
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    // 1. Get or create conversation
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const title = generateConversationTitle(message);
      const newConv = await prisma.conversation.create({
        data: {
          userId: user.id,
          title,
        },
      });
      activeConversationId = newConv.id;
    } else {
      // Verify conversation ownership
      const existing = await prisma.conversation.findFirst({
        where: { id: activeConversationId, userId: user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
      }

      // If existing title is default, auto-title from message
      if (existing.title === 'New Reflection') {
        const title = generateConversationTitle(message);
        await prisma.conversation.update({
          where: { id: existing.id },
          data: { title },
        });
      }
    }

    // 2. Safety evaluation
    const safetyResult = await evaluateSafety(message);

    // 3. Encrypt & write user message to DB (Field-level envelope encryption)
    const encryptedUserContent = await encryptUserMessage(user.id, message.trim());
    const savedUserMessage = await prisma.message.create({
      data: {
        conversationId: activeConversationId,
        role: 'user',
        contentEncrypted: encryptedUserContent,
      },
    });

    // 4. Log safety flag if detected
    if (safetyResult.flagged && safetyResult.category) {
      await prisma.safetyFlag.create({
        data: {
          messageId: savedUserMessage.id,
          category: safetyResult.category,
          severity: safetyResult.severity || 'high',
        },
      });
    }

    // 5. Compliance audit log entry
    await recordAuditLog({
      userId: user.id,
      actor: 'user',
      action: 'message_sent',
      metadata: {
        conversationId: activeConversationId,
        messageId: savedUserMessage.id,
        safetyFlagged: safetyResult.flagged,
        safetyCategory: safetyResult.category || null,
      },
    });

    // 6. Fetch previous conversation context (decrypted on the fly)
    const history = await prisma.message.findMany({
      where: { conversationId: activeConversationId },
      orderBy: { createdAt: 'asc' },
      take: 20, // last 20 messages for context
    });

    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        try {
          const decrypted = await decryptUserMessage(user.id, msg.contentEncrypted);
          claudeMessages.push({ role: msg.role, content: decrypted });
        } catch {
          // Skip corrupt or un-decryptable message
        }
      }
    }

    // Determine system prompt based on safety
    const systemPrompt = safetyResult.flagged
      ? HUSHLEE_SAFETY_SYSTEM_PROMPT
      : HUSHLEE_SYSTEM_PROMPT;

    // Check if Claude API key is configured
    const hasValidKey =
      process.env.CLAUDE_API_KEY &&
      !process.env.CLAUDE_API_KEY.includes('dummy') &&
      process.env.CLAUDE_API_KEY.startsWith('sk-');

    // 7. Prepare streaming response
    const encoder = new TextEncoder();
    let accumulatedAssistantText = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (hasValidKey) {
            // Live Claude Messages API streaming
            const claudeStream = await anthropic.messages.stream({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1024,
              system: systemPrompt,
              messages: claudeMessages,
            });

            for await (const chunk of claudeStream) {
              if (
                chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta'
              ) {
                const text = chunk.delta.text;
                accumulatedAssistantText += text;
                controller.enqueue(encoder.encode(text));
              }
            }
          } else {
            // Intelligent fallback coach response for dev/demo mode
            const mockResponse = getMockCoachResponse(message, safetyResult.flagged);
            const chunks = mockResponse.split(/(?<=[.?!,\n])\s+/);
            for (const chunk of chunks) {
              accumulatedAssistantText += chunk + ' ';
              controller.enqueue(encoder.encode(chunk + ' '));
              await new Promise((r) => setTimeout(r, 60)); // emulate natural pacing
            }
          }

          // 8. Encrypt & persist assistant response once complete
          if (accumulatedAssistantText.trim()) {
            const encryptedAssistantContent = await encryptUserMessage(
              user.id,
              accumulatedAssistantText.trim()
            );
            await prisma.message.create({
              data: {
                conversationId: activeConversationId,
                role: 'assistant',
                contentEncrypted: encryptedAssistantContent,
              },
            });
          }

          controller.close();
        } catch (err: unknown) {
          console.error('Streaming error:', err);
          const errorMsg = '\n\n[An error occurred while generating your response. Please try again.]';
          controller.enqueue(encoder.encode(errorMsg));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'x-conversation-id': activeConversationId,
        'x-safety-flagged': safetyResult.flagged ? 'true' : 'false',
        'x-safety-category': safetyResult.category || '',
      },
    });
  } catch (err: unknown) {
    console.error('Chat endpoint error:', err);
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function generateConversationTitle(message: string): string {
  const cleaned = message.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleaned.split(/\s+/).slice(0, 5).join(' ');
  return words.length > 3 ? words.charAt(0).toUpperCase() + words.slice(1) : 'Reflection';
}

function getMockCoachResponse(message: string, isFlagged: boolean): string {
  if (isFlagged) {
    return (
      "I hear how much pain you are carrying right now, and I want you to know you don't have to carry this completely alone.\n\n" +
      "Because your safety and well-being come before anything else, I cannot guide you through this as a coach. Please consider reaching out right now to the free, confidential support resources listed on the screen. There are compassionate people ready to listen and support you 24/7."
    );
  }

  return (
    `Thank you for sharing that with me. It takes courage to step back and examine what is happening between you and someone you care about.\n\n` +
    `When situations like this happen, it often feels like the surface argument is masking a deeper emotional need — such as wanting to feel heard, respected, or emotionally safe.\n\n` +
    `Let's take this one step at a time. When you reflect on what happened, what feeling or need was strongest for you in that moment?`
  );
}
