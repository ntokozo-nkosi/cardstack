import { NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const deckResult = await query(
      `SELECT id, name, description, created_at as "createdAt" 
       FROM decks WHERE id = $1`,
      [id]
    )

    if (deckResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      )
    }

    const cardsResult = await query(
      `SELECT id, deck_id as "deckId", front, back, created_at as "createdAt" 
       FROM cards WHERE deck_id = $1 
       ORDER BY created_at DESC`,
      [id]
    )

    const deck = {
      ...deckResult.rows[0],
      cards: cardsResult.rows
    }

    return NextResponse.json(deck)
  } catch (error) {
    console.error('Failed to fetch deck:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deck' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const result = await query(
      `UPDATE decks SET name = $1, description = $2 
       WHERE id = $3 
       RETURNING id, name, description, created_at as "createdAt"`,
      [name.trim(), description?.trim() || null, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Failed to update deck:', error)
    return NextResponse.json(
      { error: 'Failed to update deck' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await query('DELETE FROM decks WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete deck:', error)
    return NextResponse.json(
      { error: 'Failed to delete deck' },
      { status: 500 }
    )
  }
}
