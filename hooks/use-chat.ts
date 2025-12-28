'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/lib/stores/chat-store'

/**
 * Hook to access a specific chat.
 * Automatically fetches from server if not in store.
 */
export function useChat(chatId: string) {
  const currentChat = useChatStore((state) => state.currentChat)
  const isLoading = useChatStore((state) => state.currentChatLoading)
  const fetchChat = useChatStore((state) => state.fetchChat)

  useEffect(() => {
    if (chatId) {
      fetchChat(chatId)
    }
  }, [chatId, fetchChat])

  // Return the chat only if it matches the requested ID
  const chat = currentChat?.id === chatId ? currentChat : null

  return { chat, isLoading }
}
