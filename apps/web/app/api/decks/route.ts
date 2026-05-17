import { NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getCurrentUserDb } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const user = await getCurrentUserDb()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const result = await query(`
      SELECT
        d.id,
        d.name,
        d.description,
        d.created_at as "createdAt",
        COUNT(c.id)::int as "cardCount",
        COUNT(c.id) FILTER (WHERE c.due_date IS NULL OR c.due_date <= CURRENT_TIMESTAMP)::int as "dueCount"
      FROM decks d
      LEFT JOIN cards c ON c.deck_id = d.id
      WHERE d.user_id = $1
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `, [user.id])

    const decks = result.rows.map((row: { id: string; name: string; description: string | null; createdAt: Date; cardCount: number; dueCount: number }) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.createdAt,
      _count: { cards: row.cardCount, due: row.dueCount }
    }))

    return NextResponse.json(decks)
  } catch (error) {
    console.error('Failed to fetch decks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserDb()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO decks (name, description, user_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, description, created_at as "createdAt"`,
      [name.trim(), description?.trim() || null, user.id]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Failed to create deck:', error)
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    )
  }
}
