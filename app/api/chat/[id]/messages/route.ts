import { NextResponse } from 'next/server'
import { getCurrentUserDb } from '@/lib/auth-helpers'
import { query } from '@/lib/database'
import { ChatOpenAI } from '@langchain/openai'
import { SystemMessage, HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages'
import { createToolsForUser, executeTool } from '@/lib/chat/tools'

type RouteParams = { params: Promise<{ id: string }> }

const SYSTEM_PROMPT = `You are a helpful assistant for managing flashcard collections and decks in CardStack.

Your capabilities:
- View collections and decks
- Create new collections and decks
- Update collection/deck names and descriptions
- Add or remove decks from collections
- Create new flashcards in a deck
- Edit existing flashcards

Tool selection for creating flashcards:
- Use create_flashcard for adding a single flashcard
- Use bulk_create_flashcards for adding 2 or more flashcards to the same deck

You cannot delete collections, decks, or flashcards.

Be concise and helpful. Use your tools to help users organize their flashcards.`

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

    // Build conversation history with system message and proper message types
    const conversationHistory = [
      new SystemMessage(SYSTEM_PROMPT),
      ...messages.map((msg: { role: string; content: string }) =>
        msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
      ),
      new HumanMessage(content.trim())
    ]

    // Create model with tools
    const tools = createToolsForUser(user.id)
    const model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.7,
    })
    const modelWithTools = model.bindTools(tools)

    // Tool execution loop (max 5 iterations to prevent infinite loops)
    let currentMessages = [...conversationHistory]
    let finalResponse = null

    for (let i = 0; i < 5; i++) {
      const response = await modelWithTools.invoke(currentMessages)

      // If no tool calls, we have the final response
      if (!response.tool_calls?.length) {
        finalResponse = response
        break
      }

      // Add the AI response with tool calls to the message history
      currentMessages.push(response)

      // Execute each tool call using the helper function
      for (const toolCall of response.tool_calls) {
        const result = await executeTool(tools, toolCall.name, toolCall.args as Record<string, unknown>)
        currentMessages.push(new ToolMessage({
          tool_call_id: toolCall.id!,
          content: result
        }))
      }
    }

    // Extract the final AI response content
    const aiResponse = finalResponse?.content as string || 'I apologize, but I was unable to generate a response.'

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
