import { NextResponse } from 'next/server'
import { getCurrentUserDb } from '@/lib/auth-helpers'
import { query } from '@/lib/database'

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

  try {
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || !content.trim()) {
      return new NextResponse('Message content is required', { status: 400 })
    }

    // Simulate AI processing delay (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Call database function to create user message and AI response
    const result = await query(
      'SELECT send_message_with_ai_response($1, $2, $3) as data',
      [chatId, user.id, content.trim()]
    )

    const data = result.rows[0]?.data

    if (!data) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
