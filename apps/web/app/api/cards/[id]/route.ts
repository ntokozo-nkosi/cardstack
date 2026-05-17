import { NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getCurrentUserDb } from '@/lib/auth-helpers'

export async function PUT(
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
    const { front, back, deckId } = body

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

    if (deckId !== undefined && deckId !== null && typeof deckId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid deck ID' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT * FROM update_card_if_owned($1, $2, $3, $4, $5)',
      [id, user.id, front.trim(), back.trim(), deckId || null]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Card not found or unauthorized' },
        { status: 404 }
      )
    }

    const card = result.rows[0]
    return NextResponse.json({
      id: card.id,
      deckId: card.deck_id,
      front: card.front,
      back: card.back,
      createdAt: card.created_at
    })
  } catch (error) {
    console.error('Failed to update card:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserDb()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params

    const result = await query(
      'SELECT delete_card_if_owned($1, $2) as deleted',
      [id, user.id]
    )

    if (!result.rows[0]?.deleted) {
      return NextResponse.json(
        { error: 'Card not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete card:', error)
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    )
  }
}

