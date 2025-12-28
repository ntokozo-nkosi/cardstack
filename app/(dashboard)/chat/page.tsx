'use client'

import { useRouter } from 'next/navigation'
import { useChatStore } from '@/lib/stores/chat-store'
import { useSidebar } from '@/components/ui/sidebar'
import { ChatInput } from '@/components/chat/chat-input'
import { toast } from 'sonner'
import type { Message } from '@/lib/types/chat'

export default function NewChatPage() {
  const router = useRouter()
  const createChat = useChatStore((state) => state.createChat)
  const setCurrentChat = useChatStore((state) => state.setCurrentChat)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const { state: sidebarState, isMobile } = useSidebar()

  const isCollapsed = sidebarState === 'collapsed'

  const handleSend = async (content: string) => {
    const chatId = crypto.randomUUID()
    const title = content.slice(0, 50) || 'New Chat'

    // Optimistic update: create messages before navigation so they're visible immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      chatId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    const loadingMessage: Message = {
      id: 'loading-' + crypto.randomUUID(),
      chatId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }

    setCurrentChat({
      id: chatId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [userMessage, loadingMessage],
    })

    // Navigate immediately - user sees their message right away
    router.push(`/chat/${chatId}`)

    // Create chat on server in background
    const chat = await createChat(chatId, title)
    if (!chat) {
      toast.error('Failed to create chat')
      return
    }

    // Send message and get AI response
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      // Replace optimistic messages with real ones from server
      setCurrentChat({
        id: chatId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [data.userMessage, data.assistantMessage],
      })
    } catch (error) {
      toast.error('Failed to send message')
      // Keep user message visible but remove loading state
      setCurrentChat({
        id: chatId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [userMessage],
      })
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
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  )
}
