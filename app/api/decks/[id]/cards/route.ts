import { NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function POST(
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
