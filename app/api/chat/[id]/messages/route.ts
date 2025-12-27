import { NextResponse } from 'next/server'
import { getCurrentUserDb } from '@/lib/auth-helpers'
import { addMessage, getChat } from '@/lib/stores/chat-memory-store'
import { generateMockResponse } from '@/lib/chat/mock-ai'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * POST /api/chat/[id]/messages - Send a message and get AI response
 */
export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUserDb()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id: chatId } = await params

  // Verify chat exists
  const chat = getChat(user.id, chatId)
  if (!chat) {
    return new NextResponse('Chat not found', { status: 404 })
  }

  try {
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return new NextResponse('Content is required', { status: 400 })
    }

    // Add user message
    const userMessage = addMessage(user.id, chatId, 'user', content)
    if (!userMessage) {
      return new NextResponse('Failed to add message', { status: 500 })
    }

    // Generate AI response
    const aiContent = await generateMockResponse(content)

    // Add assistant message
    const assistantMessage = addMessage(user.id, chatId, 'assistant', aiContent)
    if (!assistantMessage) {
      return new NextResponse('Failed to add AI response', { status: 500 })
    }

    return NextResponse.json({
      userMessage,
      assistantMessage,
    })
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }
}
