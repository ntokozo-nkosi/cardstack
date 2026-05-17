'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/lib/stores/chat-store'

/**
 * Hook for accessing chat list with lazy loading.
 * Automatically fetches chats on first use.
 */
export function useChats() {
  const chats = useChatStore((state) => state.chats)
  const chatsLoaded = useChatStore((state) => state.chatsLoaded)
  const chatsLoading = useChatStore((state) => state.chatsLoading)
  const chatsError = useChatStore((state) => state.chatsError)
  const ensureChatsLoaded = useChatStore((state) => state.ensureChatsLoaded)

  useEffect(() => {
    ensureChatsLoaded()
  }, [ensureChatsLoaded])

  return {
    chats,
    isLoaded: chatsLoaded,
    isLoading: chatsLoading,
    error: chatsError,
  }
}
