import { NextResponse } from 'next/server'
import { getCurrentUserDb } from '@/lib/auth-helpers'
import { query } from '@/lib/database'
import { ChatOpenAI } from '@langchain/openai'

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

    // Fetch chat history to provide conversation context
    const chatResult = await query('SELECT * FROM get_chat_by_id($1, $2)', [chatId, user.id])
    const chat = chatResult.rows[0]?.get_chat_by_id

    if (!chat) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    const messages = chat?.messages || []

    // Build conversation history for LangChain
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }))

    // Add new user message to context
    conversationHistory.push({ role: 'user', content: content.trim() })

    // Get AI response using LangChain
    const model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.7,
    })

    const response = await model.invoke(conversationHistory)
    const aiResponse = response.content as string

    // Store messages in database
    const result = await query(
      'SELECT send_message_with_ai_response($1, $2, $3, $4) as data',
      [chatId, user.id, content.trim(), aiResponse]
    )

    const data = result.rows[0]?.data

    if (!data) {
      return new NextResponse('Failed to save messages', { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
