import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db';
import { recordAuditLog } from '@/lib/audit';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'data_only'; // 'data_only' | 'account'

    if (mode === 'data_only') {
      // 1. Audit log before erasure
      await recordAuditLog({
        userId: user.id,
        actor: 'user',
        action: 'deletion_requested',
        metadata: {
          scope: 'all_conversations',
          requestedAt: new Date().toISOString(),
        },
      });

      // 2. Delete all user conversations (cascades to messages and safety flags)
      const deleted = await prisma.conversation.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json({
        success: true,
        scope: 'data_only',
        deletedConversationsCount: deleted.count,
        message: 'All conversations and message records have been permanently erased.',
      });
    }

    if (mode === 'account') {
      // 1. Audit log before account removal
      await recordAuditLog({
        userId: user.id,
        actor: 'user',
        action: 'deletion_requested',
        metadata: {
          scope: 'full_account',
          requestedAt: new Date().toISOString(),
        },
      });

      // 2. Delete the user record (cascades through Prisma foreign keys)
      await prisma.user.delete({
        where: { id: user.id },
      });

      // 3. Clear session and guest cookies
      const cookieStore = await cookies();
      cookieStore.delete('hushlee_guest_user_id');
      cookieStore.delete('authjs.session-token');
      cookieStore.delete('__Secure-authjs.session-token');

      return NextResponse.json({
        success: true,
        scope: 'account',
        message: 'Your account and all associated data have been permanently erased.',
      });
    }

    return NextResponse.json({ error: 'Invalid deletion mode specified' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Deletion error:', err);
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
