'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/lib/stores/chat-store'
import { ChatInput } from '@/components/chat/chat-input'
import { MessageSquarePlus } from 'lucide-react'
import { toast } from 'sonner'

export default function NewChatPage() {
  const router = useRouter()
  const createChat = useChatStore((state) => state.createChat)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const [isCreating, setIsCreating] = useState(false)

  const handleSend = async (content: string) => {
    setIsCreating(true)

    try {
      // Create new chat
      const chat = await createChat()
      if (!chat) {
        toast.error('Failed to create chat')
        setIsCreating(false)
        return
      }

      // Send first message
      const result = await sendMessage(chat.id, content)
      if (!result) {
        toast.error('Failed to send message')
        setIsCreating(false)
        return
      }

      // Navigate to chat page
      router.push(`/chat/${chat.id}`)
    } catch {
      toast.error('Something went wrong')
      setIsCreating(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Empty state with centered prompt */}
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <MessageSquarePlus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Start a new conversation</h2>
          <p className="text-muted-foreground">
            Ask me anything about your flashcards, learning strategies, or any topic
            you&apos;d like to explore.
          </p>
        </div>
      </div>

      {/* Input fixed at bottom */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleSend} disabled={isCreating} />
        </div>
      </div>
    </div>
  )
}
