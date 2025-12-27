'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useChat } from '@/hooks/use-chat'
import { useChatStore } from '@/lib/stores/chat-store'
import { useSidebar } from '@/components/ui/sidebar'
import { ChatMessage } from '@/components/chat/chat-message'
import { ChatInput } from '@/components/chat/chat-input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="shrink-0 bg-background px-4 pb-6 pt-2">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-4 h-px w-16 bg-border" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string
  const { chat, isLoading, pendingMessage, isWaitingForAI } = useChat(chatId)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const { state: sidebarState, isMobile } = useSidebar()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isCollapsed = sidebarState === 'collapsed'

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages, pendingMessage])

  const handleSend = async (content: string) => {
    const result = await sendMessage(chatId, content)
    if (!result) {
      toast.error('Failed to send message')
    }
  }

  if (isLoading) {
    return <ChatSkeleton />
  }

  if (!chat) {
    router.push('/chat')
    return null
  }

  return (
    <div className="relative h-full">
      {/* Messages container */}
      <ScrollArea className="h-full">
        <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 pb-32">
          {chat.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Optimistic pending message */}
          {pendingMessage && (
            <>
              <ChatMessage
                message={{
                  id: 'pending-user',
                  role: 'user',
                  content: pendingMessage,
                  chatId,
                  createdAt: new Date().toISOString(),
                }}
              />
              {isWaitingForAI && (
                <ChatMessage
                  message={{
                    id: 'pending-assistant',
                    role: 'assistant',
                    content: '',
                    chatId,
                    createdAt: new Date().toISOString(),
                  }}
                  isLoading
                />
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Fixed input at bottom - responsive to sidebar */}
      <div
        className="pointer-events-none fixed bottom-0 right-0 px-4 pb-4 transition-[left] duration-200 ease-linear"
        style={{
          left: isMobile ? 0 : isCollapsed ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)'
        }}
      >
        <div className="pointer-events-auto mx-auto max-w-2xl">
          <ChatInput onSend={handleSend} disabled={isWaitingForAI} />
        </div>
      </div>
    </div>
  )
}
