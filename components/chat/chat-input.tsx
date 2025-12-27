'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendHorizonal } from 'lucide-react'

interface ChatInputProps {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Type a message...',
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

  return (
    <div className="flex items-end gap-2">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        className="min-h-[44px] max-h-[200px] resize-none"
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!input.trim() || isDisabled}
        size="icon"
        className="h-11 w-11 shrink-0"
      >
        <SendHorizonal className="h-5 w-5" />
      </Button>
    </div>
  )
}
