import { NextResponse } from 'next/server'
import { getCurrentUserDb } from '@/lib/auth-helpers'
import { getUserChats, createChat } from '@/lib/stores/chat-memory-store'

/**
 * GET /api/chat - List all chats for the current user
 */
export async function GET() {
  const user = await getCurrentUserDb()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const chats = getUserChats(user.id)
  return NextResponse.json(chats)
}

/**
 * POST /api/chat - Create a new chat
 */
export async function POST(request: Request) {
  const user = await getCurrentUserDb()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await request.json()
    const chat = createChat(user.id, body.title)

    // Return without messages for list view
    const { messages, ...chatSummary } = chat
    return NextResponse.json(chatSummary, { status: 201 })
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }
}
