'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Lock, Menu, Settings } from 'lucide-react';
import { ChatSidebar, ConversationItem } from '@/components/Chat/ChatSidebar';
import { ChatMessage, MessageProps } from '@/components/Chat/ChatMessage';
import { ChatComposer } from '@/components/Chat/ChatComposer';
import { ConfidentialityModal } from '@/components/Chat/ConfidentialityModal';
import { OnboardingModal } from '@/components/Onboarding/OnboardingModal';
import { CrisisResourcePanel } from '@/components/Chat/CrisisResourcePanel';

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isConfidentialityModalOpen, setIsConfidentialityModalOpen] = useState(false);

  // Safety escalation state
  const [isSafetyFlagged, setIsSafetyFlagged] = useState(false);
  const [safetyCategory, setSafetyCategory] = useState<'self_harm' | 'abuse_disclosure' | 'crisis' | null>(null);

  // User consent / onboarding state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isSafetyFlagged]);

  // 1. Check user status & consent
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/user/status');
        if (res.ok) {
          const data = await res.json();
          setHasConsented(data.hasConsented);
          setUserEmail(data.email || undefined);
          if (data.hasConsented) {
            loadConversations();
          }
        }
      } catch (err) {
        console.error('Failed to load user status:', err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkStatus();
  }, []);

  // 2. Fetch conversations
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !activeConversationId) {
          selectConversation(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  // 3. Select conversation and load messages
  const selectConversation = async (id: string) => {
    setActiveConversationId(id);
    setStreamingContent('');
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        const loadedMessages = data.conversation.messages || [];
        setMessages(loadedMessages);

        // Check if past messages triggered safety flags
        const flaggedMsg = loadedMessages.find(
          (m: { safetyFlags?: Array<{ category: string }> }) => m.safetyFlags && m.safetyFlags.length > 0
        );
        if (flaggedMsg && flaggedMsg.safetyFlags[0]) {
          setIsSafetyFlagged(true);
          setSafetyCategory(flaggedMsg.safetyFlags[0].category as 'self_harm' | 'abuse_disclosure' | 'crisis');
        } else {
          setIsSafetyFlagged(false);
          setSafetyCategory(null);
        }
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  // 4. Create new conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setIsSafetyFlagged(false);
    setSafetyCategory(null);
  };

  // 5. Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          handleNewConversation();
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  // 6. Send message & stream response
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    // Optimistically add user message to list
    const userMsg: MessageProps = {
      role: 'user',
      content: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          message: text,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get coaching response');
      }

      // Check conversation ID header
      const newConvId = res.headers.get('x-conversation-id');
      if (newConvId && newConvId !== activeConversationId) {
        setActiveConversationId(newConvId);
        loadConversations();
      }

      // Check safety flag headers
      const flaggedHeader = res.headers.get('x-safety-flagged');
      const categoryHeader = res.headers.get('x-safety-category');
      if (flaggedHeader === 'true') {
        setIsSafetyFlagged(true);
        if (categoryHeader) {
          setSafetyCategory(categoryHeader as 'self_harm' | 'abuse_disclosure' | 'crisis');
        }
      }

      // Read stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setStreamingContent((prev) => prev + chunk);
        }
      }

      // Finalize assistant message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: accumulated,
          createdAt: new Date(),
        },
      ]);
      setStreamingContent('');
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an issue processing your reflection. Please try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Active conversation title
  const activeTitle =
    conversations.find((c) => c.id === activeConversationId)?.title || 'New Reflection';

  return (
    <div className="flex h-screen bg-[#FDFBF7] text-[#2C3333] overflow-hidden">
      {/* Onboarding Modal if consent not yet given */}
      <OnboardingModal
        isOpen={!checkingAuth && hasConsented === false}
        onComplete={() => {
          setHasConsented(true);
          loadConversations();
        }}
        userEmail={userEmail}
      />

      {/* Confidentiality Explainer Modal */}
      <ConfidentialityModal
        isOpen={isConfidentialityModalOpen}
        onClose={() => setIsConfidentialityModalOpen(false)}
      />

      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={selectConversation}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col justify-between h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[#EAE3D9] px-4 sm:px-6 flex items-center justify-between bg-white/70 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="md:hidden text-[#5A6460] hover:text-[#1F2421] p-1"
              aria-label="Open conversation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="font-serif text-sm font-medium text-[#1F2421] truncate max-w-[200px] sm:max-w-xs">
                {activeTitle}
              </span>
              <span className="text-[10px] text-[#7B8580] hidden sm:inline">
                AI Relationship Reflection
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Persistent Confidentiality Badge */}
            <button
              onClick={() => setIsConfidentialityModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFECE6] border border-[#DDD7CD] text-xs font-medium text-[#4A5548] hover:bg-[#E5DFD5] transition-colors"
              title="Click to read confidentiality details"
            >
              <Lock className="w-3.5 h-3.5 text-[#5D7052]" />
              <span>Hushlee — never sold or shared</span>
            </button>

            <Link
              href="/settings"
              className="p-1.5 rounded-xl text-[#5A6460] hover:text-[#1F2421] hover:bg-[#EFECE6] transition-colors"
              title="Settings & Privacy"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Crisis Resource Panel (Surfaces automatically on safety flag) */}
        <CrisisResourcePanel
          isOpen={isSafetyFlagged}
          category={safetyCategory}
          onDismiss={() => setIsSafetyFlagged(false)}
        />

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">
          {messages.length === 0 && !streamingContent ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 rounded-3xl bg-[#EFECE6] flex items-center justify-center text-[#5D7052] font-serif text-2xl mb-4 shadow-2xs">
                H
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1F2421] mb-2">
                Welcome to your quiet space.
              </h2>
              <p className="text-sm text-[#5A6460] max-w-md leading-relaxed mb-6">
                Tell me what has been weighing on you or what relationship pattern you would like to explore today.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full text-left text-xs">
                <button
                  onClick={() =>
                    handleSendMessage(
                      'I feel like my partner and I keep having the same argument over and over without resolving it.'
                    )
                  }
                  className="p-3 rounded-2xl bg-white/80 border border-[#E8E1D7] text-[#4A5548] hover:bg-[#F2EEE7] hover:text-[#1F2421] transition-colors"
                >
                  &quot;We keep having the same argument over and over...&quot;
                </button>
                <button
                  onClick={() =>
                    handleSendMessage(
                      'I need help setting a healthy emotional boundary with a close family member.'
                    )
                  }
                  className="p-3 rounded-2xl bg-white/80 border border-[#E8E1D7] text-[#4A5548] hover:bg-[#F2EEE7] hover:text-[#1F2421] transition-colors"
                >
                  &quot;I need help setting a boundary with family...&quot;
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id || index}
                  role={msg.role}
                  content={msg.content}
                  createdAt={msg.createdAt}
                />
              ))}

              {/* Active streaming assistant message */}
              {isStreaming && (
                <ChatMessage
                  role="assistant"
                  content={streamingContent}
                  isStreaming={true}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent pt-2">
          <ChatComposer onSend={handleSendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>
  );
}
