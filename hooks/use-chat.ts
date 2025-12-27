'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/lib/stores/chat-store'

/**
 * Hook for accessing a specific chat with messages.
 * Automatically fetches the chat on mount.
 */
export function useChat(chatId: string | null) {
  const currentChat = useChatStore((state) => state.currentChat)
  const currentChatLoading = useChatStore((state) => state.currentChatLoading)
  const pendingMessage = useChatStore((state) => state.pendingMessage)
  const isWaitingForAI = useChatStore((state) => state.isWaitingForAI)
  const fetchChat = useChatStore((state) => state.fetchChat)
  const clearCurrentChat = useChatStore((state) => state.clearCurrentChat)

  useEffect(() => {
    if (chatId) {
      fetchChat(chatId)
    }

    // Clear current chat when unmounting
    return () => {
      clearCurrentChat()
    }
  }, [chatId, fetchChat, clearCurrentChat])

  return {
    chat: currentChat,
    isLoading: currentChatLoading,
    pendingMessage,
    isWaitingForAI,
  }
}
