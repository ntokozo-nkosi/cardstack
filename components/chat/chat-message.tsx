'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types/chat'
import { Loader2 } from 'lucide-react'

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
}

const TRUNCATE_LENGTH = 500

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isUser = message.role === 'user'
  const shouldTruncate = isUser && message.content.length > TRUNCATE_LENGTH

  const displayContent = shouldTruncate && !isExpanded
    ? message.content.slice(0, TRUNCATE_LENGTH) + '...'
    : message.content

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
          <>
            <p className="whitespace-pre-wrap text-base leading-relaxed">{displayContent}</p>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-sm opacity-70 hover:opacity-100 underline"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
