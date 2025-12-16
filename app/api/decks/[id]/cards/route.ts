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
    const { front, back } = body

    if (!front || front.trim() === '') {
      return NextResponse.json(
        { error: 'Front is required' },
        { status: 400 }
      )
    }

    if (!back || back.trim() === '') {
      return NextResponse.json(
        { error: 'Back is required' },
        { status: 400 }
      )
    }

    // specific check: ensure deck belongs to user
    const deckCheck = await query(
      'SELECT id FROM decks WHERE id = $1 AND user_id = $2',
      [id, user.id]
    )

    if (deckCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      )
    }

    const result = await query(
      `INSERT INTO cards (deck_id, front, back) 
       VALUES ($1, $2, $3) 
       RETURNING id, deck_id as "deckId", front, back, created_at as "createdAt"`,
      [id, front.trim(), back.trim()]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Failed to create card:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
}
