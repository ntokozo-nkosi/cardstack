'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useChat } from '@/hooks/use-chat'
import { useChatStore } from '@/lib/stores/chat-store'
import { useSidebar } from '@/components/ui/sidebar'
import { ChatInput } from '@/components/chat/chat-input'
import { ChatMessage } from '@/components/chat/chat-message'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

function ChatSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-2 text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  )
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string
  const { chat, isLoading } = useChat(chatId)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const isSendingMessage = useChatStore((state) => state.isSendingMessage)
  const { state: sidebarState, isMobile } = useSidebar()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isCollapsed = sidebarState === 'collapsed'

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages])

  // Redirect if chat doesn't exist
  useEffect(() => {
    if (!isLoading && !chat) {
      router.push('/chat')
    }
  }, [isLoading, chat, router])

  const handleSend = async (content: string) => {
    const success = await sendMessage(chatId, content)
    if (!success) {
      toast.error('Failed to send message')
    }
  }

  if (isLoading) {
    return <ChatSkeleton />
  }

  if (!chat) {
    return null
  }

  const hasMessages = chat.messages.length > 0
  const messages = chat.messages
  const lastMessage = messages[messages.length - 1]
  const isLoadingAi = lastMessage?.role === 'assistant' && lastMessage.id.startsWith('loading-')

  return (
    <div className="relative h-full flex flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 pt-8 pb-32">
          {!hasMessages ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-medium text-foreground/80">
                  What can I help with?
                </h2>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLoading={message.id.startsWith('loading-')}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Fixed input at bottom - responsive to sidebar */}
      <div
        className="pointer-events-none fixed bottom-0 right-0 px-4 pb-4 transition-[left] duration-200 ease-linear"
        style={{
          left: isMobile ? 0 : isCollapsed ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)'
        }}
      >
        <div className="pointer-events-auto mx-auto max-w-2xl">
          <ChatInput
            onSend={handleSend}
            disabled={isSendingMessage}
          />
        </div>
      </div>
    </div>
  )
}
