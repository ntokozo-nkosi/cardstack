import { NextResponse } from 'next/server'
import { getCurrentUserDb } from '@/lib/auth-helpers'
import { getChat, updateChatTitle, deleteChat } from '@/lib/stores/chat-memory-store'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/chat/[id] - Get a specific chat with all messages
 */
export async function GET(request: Request, { params }: RouteParams) {
  const user = await getCurrentUserDb()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const chat = getChat(user.id, id)

  if (!chat) {
    return new NextResponse('Chat not found', { status: 404 })
  }

  return NextResponse.json(chat)
}

/**
 * PUT /api/chat/[id] - Update chat title
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const user = await getCurrentUserDb()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== 'string') {
      return new NextResponse('Title is required', { status: 400 })
    }

    const success = updateChatTitle(user.id, id, title)

    if (!success) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }
}

/**
 * DELETE /api/chat/[id] - Delete a chat
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUserDb()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const success = deleteChat(user.id, id)

  if (!success) {
    return new NextResponse('Chat not found', { status: 404 })
  }

  return NextResponse.json({ success: true })
}
