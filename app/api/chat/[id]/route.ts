import { NextResponse } from 'next/server'
import { getCurrentUserDb } from '@/lib/auth-helpers'
import { query } from '@/lib/database'

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

  try {
    const result = await query('SELECT get_chat_by_id($1, $2) as chat', [id, user.id])
    const chat = result.rows[0]?.chat

    if (!chat) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error fetching chat:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
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

    const result = await query('SELECT update_chat_title($1, $2, $3) as success', [id, user.id, title])
    const success = result.rows[0]?.success

    if (!success) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating chat:', error)
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

  try {
    const result = await query('SELECT delete_chat_if_owned($1, $2) as success', [id, user.id])
    const success = result.rows[0]?.success

    if (!success) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
