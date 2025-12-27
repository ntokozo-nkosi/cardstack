'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useChat } from '@/hooks/use-chat'
import { useChatStore } from '@/lib/stores/chat-store'
import { ChatMessage } from '@/components/chat/chat-message'
import { ChatInput } from '@/components/chat/chat-input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <Skeleton className="h-11 w-full" />
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    <div className="flex h-full flex-col">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
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
      </div>

      {/* Input fixed at bottom */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleSend} disabled={isWaitingForAI} />
        </div>
      </div>
    </div>
  )
}
