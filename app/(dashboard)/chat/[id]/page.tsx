'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useChat } from '@/hooks/use-chat'
import { Skeleton } from '@/components/ui/skeleton'

function ChatSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-2 text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  )
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string
  const { chat, isLoading } = useChat(chatId)

  // Redirect if chat doesn't exist (in effect to avoid render-time navigation)
  useEffect(() => {
    if (!isLoading && !chat) {
      router.push('/chat')
    }
  }, [isLoading, chat, router])

  // Show loading skeleton while fetching
  if (isLoading) {
    return <ChatSkeleton />
  }

  // Show nothing while redirecting
  if (!chat) {
    return null
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{chat.title}</h1>
        <p className="text-muted-foreground mt-2">Chat session created</p>
      </div>
    </div>
  )
}
