import { create } from 'zustand'
import type { Chat, ChatWithMessages, Message } from '@/lib/types/chat'

interface ChatState {
  // Chat list state
  chats: Chat[]
  chatsLoaded: boolean
  chatsLoading: boolean
  chatsError: string | null

  // Current chat state (for detail view)
  currentChat: ChatWithMessages | null
  currentChatLoading: boolean

  // Pending message state (for optimistic UI)
  pendingMessage: string | null
  isWaitingForAI: boolean

  // Chat list actions
  fetchChats: () => Promise<void>
  ensureChatsLoaded: () => Promise<void>
  createChat: (title?: string) => Promise<Chat | null>
  deleteChat: (id: string) => Promise<boolean>
  updateChatTitle: (id: string, title: string) => Promise<boolean>

  // Current chat actions
  fetchChat: (id: string) => Promise<void>
  setCurrentChat: (chat: ChatWithMessages | null) => void
  sendMessage: (chatId: string, content: string) => Promise<{ userMessage: Message; assistantMessage: Message } | null>
  clearCurrentChat: () => void

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
  pendingMessage: null as string | null,
  isWaitingForAI: false,
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
  createChat: async (title?: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) throw new Error('Failed to create chat')

      const newChat = await response.json()

      // Add to list
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

  // Set current chat directly
  setCurrentChat: (chat: ChatWithMessages | null) => {
    set({ currentChat: chat })
  },

  // Clear current chat
  clearCurrentChat: () => {
    set({ currentChat: null, pendingMessage: null, isWaitingForAI: false })
  },

  // Send a message and get AI response
  sendMessage: async (chatId: string, content: string) => {
    const { currentChat } = get()

    // Set pending state for optimistic UI
    set({ pendingMessage: content, isWaitingForAI: true })

    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const { userMessage, assistantMessage } = await response.json()

      // Update current chat with new messages
      if (currentChat && currentChat.id === chatId) {
        set((state) => ({
          currentChat: state.currentChat
            ? {
                ...state.currentChat,
                messages: [...state.currentChat.messages, userMessage, assistantMessage],
                updatedAt: new Date().toISOString(),
              }
            : null,
          pendingMessage: null,
          isWaitingForAI: false,
        }))
      } else {
        set({ pendingMessage: null, isWaitingForAI: false })
      }

      // Update chat title in list if it was auto-generated
      const updatedChat = await fetch(`/api/chat/${chatId}`).then((r) => r.json())
      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId ? { ...c, title: updatedChat.title, updatedAt: updatedChat.updatedAt } : c
        ),
      }))

      return { userMessage, assistantMessage }
    } catch {
      set({ pendingMessage: null, isWaitingForAI: false })
      return null
    }
  },

  // Reset store to initial state
  reset: () => set(initialState),
}))
