'use client'

import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types/chat'
import { User, Bot, Loader2 } from 'lucide-react'

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-4', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'flex-1 rounded-xl px-4 py-3 max-w-[80%]',
          isUser ? 'bg-primary text-primary-foreground ml-12' : 'bg-muted mr-12'
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        )}
      </div>
    </div>
  )
}
