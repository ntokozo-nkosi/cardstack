// Chat message types
export interface Message {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

// Chat summary (for list views)
export interface Chat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

// Chat with full message history
export interface ChatWithMessages extends Chat {
  messages: Message[]
}

// Input types for API calls
export interface CreateChatInput {
  title?: string
}

export interface SendMessageInput {
  content: string
}

// API response types
export interface SendMessageResponse {
  userMessage: Message
  assistantMessage: Message
}
