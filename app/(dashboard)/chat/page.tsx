'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/lib/stores/chat-store'
import { useSidebar } from '@/components/ui/sidebar'
import { ChatInput } from '@/components/chat/chat-input'
import { toast } from 'sonner'

export default function NewChatPage() {
  const router = useRouter()
  const createChat = useChatStore((state) => state.createChat)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const { state: sidebarState, isMobile } = useSidebar()
  const [isCreating, setIsCreating] = useState(false)

  const isCollapsed = sidebarState === 'collapsed'

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
    <div className="relative h-full">
      {/* Empty state */}
      <div className="flex h-full items-center justify-center pb-32">
        <div className="mx-auto max-w-md px-4 text-center">
          <h2 className="text-2xl font-medium text-foreground/80">What can I help with?</h2>
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
          <ChatInput onSend={handleSend} disabled={isCreating} />
        </div>
      </div>
    </div>
  )
}
