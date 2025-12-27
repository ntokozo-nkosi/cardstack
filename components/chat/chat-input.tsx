'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Message...',
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = async () => {
    if (!input.trim() || disabled || isSending) return

    const content = input.trim()
    setInput('')
    setIsSending(true)

    try {
      await onSend(content)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isDisabled = disabled || isSending
  const canSend = input.trim() && !isDisabled

  return (
    <div className="relative flex items-end rounded-2xl border bg-background shadow-sm">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        className="flex-1 resize-none bg-transparent px-4 py-3 pr-12 text-base placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        rows={1}
        style={{ minHeight: '48px', maxHeight: '200px' }}
      />
      <button
        onClick={handleSubmit}
        disabled={!canSend}
        className={cn(
          'absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          canSend
            ? 'bg-foreground text-background hover:bg-foreground/90'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  )
}
