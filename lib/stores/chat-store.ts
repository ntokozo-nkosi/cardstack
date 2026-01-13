import { create } from 'zustand'
import type { Chat, ChatWithMessages, Message } from '@/lib/types/chat'
import { useAppStore } from './app-store'

interface ChatState {
  // Chat list state
  chats: Chat[]
  chatsLoaded: boolean
  chatsLoading: boolean
  chatsError: string | null

  // Current chat state
  currentChat: ChatWithMessages | null
  currentChatLoading: boolean

  // Message sending state
  isSendingMessage: boolean

  // Chat list actions
  fetchChats: () => Promise<void>
  ensureChatsLoaded: () => Promise<void>
  createChat: (id?: string, title?: string) => Promise<Chat | null>
  deleteChat: (id: string) => Promise<boolean>
  updateChatTitle: (id: string, title: string) => Promise<boolean>

  // Current chat actions
  fetchChat: (id: string) => Promise<void>
  setCurrentChat: (chat: ChatWithMessages | null) => void

  // Message actions
  sendMessage: (chatId: string, content: string) => Promise<boolean>

  // Utility actions
  reset: () => void
}

const initialState = {
  chats: [] as Chat[],
  chatsLoaded: false,
  chatsLoading: false,
  chatsError: null as string | null,
  currentChat: null as ChatWithMessages | null,
  currentChatLoading: false,
  isSendingMessage: false,
}

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  // Fetch all chats
  fetchChats: async () => {
    if (get().chatsLoading) return

    set({ chatsLoading: true, chatsError: null })

    try {
      const response = await fetch('/api/chat')
      if (!response.ok) throw new Error('Failed to fetch chats')
      const chats = await response.json()
      set({ chats, chatsLoaded: true, chatsLoading: false })
    } catch (error) {
      set({
        chatsError: error instanceof Error ? error.message : 'Unknown error',
        chatsLoading: false,
      })
    }
  },

  // Ensure chats are loaded (lazy loading helper)
  ensureChatsLoaded: async () => {
    const { chatsLoaded, chatsLoading, fetchChats } = get()
    if (!chatsLoaded && !chatsLoading) {
      await fetchChats()
    }
  },

  // Create a new chat
  createChat: async (id?: string, title?: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
      })

      if (!response.ok) {
        throw new Error('Failed to create chat')
      }

      const newChat = await response.json()

      // Add to chat list
      set((state) => ({
        chats: [newChat, ...state.chats],
      }))

      return newChat
    } catch {
      return null
    }
  },

  // Delete a chat
  deleteChat: async (id: string) => {
    const originalChats = get().chats

    // Optimistic delete
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== id),
    }))

    try {
      const response = await fetch(`/api/chat/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete chat')
      return true
    } catch {
      // Rollback
      set({ chats: originalChats })
      return false
    }
  },

  // Update chat title
  updateChatTitle: async (id: string, title: string) => {
    const originalChats = get().chats

    // Optimistic update
    set((state) => ({
      chats: state.chats.map((c) => (c.id === id ? { ...c, title } : c)),
    }))

    try {
      const response = await fetch(`/api/chat/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) throw new Error('Failed to update chat title')
      return true
    } catch {
      // Rollback
      set({ chats: originalChats })
      return false
    }
  },

  // Fetch a specific chat with messages
  fetchChat: async (id: string) => {
    const { currentChat } = get()

    // Skip if we already have this chat
    if (currentChat && currentChat.id === id) {
      return
    }

    set({ currentChatLoading: true })

    try {
      const response = await fetch(`/api/chat/${id}`)
      if (!response.ok) throw new Error('Failed to fetch chat')

      const chat = await response.json()
      set({ currentChat: chat, currentChatLoading: false })
    } catch {
      set({ currentChat: null, currentChatLoading: false })
    }
  },

  // Set current chat directly (for optimistic updates)
  setCurrentChat: (chat: ChatWithMessages | null) => {
    set({ currentChat: chat })
  },

  // Send message to chat
  sendMessage: async (chatId: string, content: string) => {
    const { currentChat } = get()

    if (!currentChat || currentChat.id !== chatId) {
      return false
    }

    set({ isSendingMessage: true })

    // Optimistic update: show user message immediately with temp ID
    const optimisticUserMessage: Message = {
      id: crypto.randomUUID(),
      chatId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    // Loading state: temporary message with 'loading-' prefix for detection
    const loadingAiMessage: Message = {
      id: 'loading-' + crypto.randomUUID(),
      chatId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }

    // Save current state for rollback if request fails
    const previousChat = currentChat
    set({
      currentChat: {
        ...currentChat,
        messages: [...currentChat.messages, optimisticUserMessage, loadingAiMessage],
      },
    })

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

      // Replace optimistic messages with real ones from server (proper IDs)
      set((state) => {
        if (!state.currentChat || state.currentChat.id !== chatId) {
          return state
        }

        return {
          currentChat: {
            ...state.currentChat,
            messages: [
              ...state.currentChat.messages.filter(
                (m) => m.id !== optimisticUserMessage.id && m.id !== loadingAiMessage.id
              ),
              data.userMessage,
              data.assistantMessage,
            ],
          },
          isSendingMessage: false,
        }
      })

      // Sync created entities to app store
      if (data.createdEntities) {
        const appStore = useAppStore.getState()

        for (const deck of data.createdEntities.decks || []) {
          appStore.insertDeck(deck)
        }

        for (const collection of data.createdEntities.collections || []) {
          appStore.insertCollection(collection)
        }

        // Group cards by deck and update counts
        const cardsByDeck = new Map<string, number>()
        for (const card of data.createdEntities.cards || []) {
          cardsByDeck.set(card.deckId, (cardsByDeck.get(card.deckId) || 0) + 1)
        }
        for (const [deckId, count] of cardsByDeck) {
          appStore.incrementDeckCardCount(deckId, count)
        }
      }

      return true
    } catch (error) {
      // Rollback to previous state on failure
      set({
        currentChat: previousChat,
        isSendingMessage: false,
      })
      return false
    }
  },

  // Reset store to initial state
  reset: () => set(initialState),
}))
