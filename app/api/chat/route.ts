import { NextResponse } from 'next/server'
import { getCurrentUserDb } from '@/lib/auth-helpers'
import { query } from '@/lib/database'

/**
 * GET /api/chat - List all chats for the current user
 */
export async function GET() {
  const user = await getCurrentUserDb()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const result = await query('SELECT get_user_chats($1) as chats', [user.id])
    const chats = result.rows[0]?.chats || []
    return NextResponse.json(chats)
  } catch (error) {
    console.error('Error fetching chats:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
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
    const title = body.title || 'New Chat'
    const id = body.id || null // Optional client-provided UUID

    const result = await query(
      'SELECT create_chat($1, $2, $3) as chat',
      [id, user.id, title]
    )

    const chat = result.rows[0]?.chat
    return NextResponse.json(chat, { status: 201 })
  } catch (error) {
    console.error('Error creating chat:', error)
    return new NextResponse('Bad request', { status: 400 })
  }
}
