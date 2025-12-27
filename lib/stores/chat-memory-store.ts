/**
 * Server-side in-memory storage for chat conversations.
 * Data is stored per-user and persists only until server restart.
 *
 * Structure: userId -> chatId -> ChatWithMessages
 */

import type { Chat, ChatWithMessages, Message } from '@/lib/types/chat'

// In-memory store: userId -> Map<chatId, ChatWithMessages>
const chatStore = new Map<string, Map<string, ChatWithMessages>>()

/**
 * Get or create user's chat map
 */
function getUserChatMap(userId: string): Map<string, ChatWithMessages> {
  if (!chatStore.has(userId)) {
    chatStore.set(userId, new Map())
  }
  return chatStore.get(userId)!
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Get all chats for a user, sorted by updatedAt (most recent first)
 */
export function getUserChats(userId: string): Chat[] {
  const userChats = getUserChatMap(userId)
  const chats = Array.from(userChats.values()).map(({ messages, ...chat }) => chat)
  return chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

/**
 * Get a specific chat with all messages
 */
export function getChat(userId: string, chatId: string): ChatWithMessages | null {
  const userChats = getUserChatMap(userId)
  return userChats.get(chatId) || null
}

/**
 * Create a new chat
 */
export function createChat(userId: string, title?: string): ChatWithMessages {
  const userChats = getUserChatMap(userId)
  const now = new Date().toISOString()

  const chat: ChatWithMessages = {
    id: generateId(),
    title: title || 'New Chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  }

  userChats.set(chat.id, chat)
  return chat
}

/**
 * Add a message to a chat
 */
export function addMessage(
  userId: string,
  chatId: string,
  role: 'user' | 'assistant',
  content: string
): Message | null {
  const userChats = getUserChatMap(userId)
  const chat = userChats.get(chatId)

  if (!chat) return null

  const now = new Date().toISOString()

  const message: Message = {
    id: generateId(),
    chatId,
    role,
    content,
    createdAt: now,
  }

  chat.messages.push(message)
  chat.updatedAt = now

  // Auto-update title from first user message if title is still default
  if (chat.title === 'New Chat' && role === 'user' && chat.messages.length === 1) {
    chat.title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
  }

  return message
}

/**
 * Update chat title
 */
export function updateChatTitle(userId: string, chatId: string, title: string): boolean {
  const userChats = getUserChatMap(userId)
  const chat = userChats.get(chatId)

  if (!chat) return false

  chat.title = title
  chat.updatedAt = new Date().toISOString()
  return true
}

/**
 * Delete a chat
 */
export function deleteChat(userId: string, chatId: string): boolean {
  const userChats = getUserChatMap(userId)
  return userChats.delete(chatId)
}
