import { NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getCurrentUserDb } from '@/lib/auth-helpers'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserDb()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { cards } = body

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: 'No cards provided' },
        { status: 400 }
      )
    }

    // Validate structure of cards
    for (const card of cards) {
      if (!card.front || !card.back) {
        return NextResponse.json(
          { error: 'Invalid card format. Both front and back are required.' },
          { status: 400 }
        )
      }
    }

    // Call the bulk import stored function
    const result = await query(
      `SELECT * FROM bulk_create_cards($1, $2, $3)`,
      [id, user.id, JSON.stringify(cards)]
    )

    return NextResponse.json(result.rows, { status: 201 })
  } catch (error: any) {
    console.error('Failed to import cards:', error)
    if (error.message && error.message.includes('Deck not found')) {
        return NextResponse.json(
            { error: 'Deck not found or access denied' },
            { status: 404 }
        )
    }
    return NextResponse.json(
      { error: 'Failed to import cards' },
      { status: 500 }
    )
  }
}
