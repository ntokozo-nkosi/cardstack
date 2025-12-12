import { NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const result = await query(
      `UPDATE cards SET front = $1, back = $2 
       WHERE id = $3 
       RETURNING id, deck_id as "deckId", front, back, created_at as "createdAt"`,
      [front.trim(), back.trim(), id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
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
    const { id } = await params

    await query('DELETE FROM cards WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete card:', error)
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    )
  }
}
