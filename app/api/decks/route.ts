import { NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.created_at as "createdAt",
        COUNT(c.id)::int as "_count"
      FROM decks d
      LEFT JOIN cards c ON c.deck_id = d.id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `)

    const decks = result.rows.map((row: { id: string; name: string; description: string | null; createdAt: Date; _count: number }) => ({
      ...row,
      _count: { cards: row._count }
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
    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO decks (name, description) 
       VALUES ($1, $2) 
       RETURNING id, name, description, created_at as "createdAt"`,
      [name.trim(), description?.trim() || null]
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
