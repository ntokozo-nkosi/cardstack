'use client'

import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types/chat'
import { Loader2 } from 'lucide-react'

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser && 'justify-end')}>
      {/* Message content */}
      <div
        className={cn(
          'max-w-[85%]',
          isUser
            ? 'rounded-3xl bg-primary text-primary-foreground px-5 py-3'
            : 'text-foreground/80'
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
        )}
      </div>
    </div>
  )
}
