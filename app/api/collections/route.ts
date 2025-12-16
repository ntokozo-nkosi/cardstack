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
        c.id,
        c.name,
        c.description,
        c.created_at as "createdAt",
        COUNT(cd.deck_id)::int as "_count"
      FROM collections c
      LEFT JOIN collection_decks cd ON cd.collection_id = c.id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [user.id])

        const collections = result.rows.map((row: { id: string; name: string; description: string | null; createdAt: Date; _count: number }) => ({
            ...row,
            _count: { decks: row._count }
        }))

        return NextResponse.json(collections)
    } catch (error) {
        console.error('Failed to fetch collections:', error)
        return NextResponse.json(
            { error: 'Failed to fetch collections' },
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
            `INSERT INTO collections (name, description, user_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, description, created_at as "createdAt"`,
            [name.trim(), description?.trim() || null, user.id]
        )

        return NextResponse.json(result.rows[0], { status: 201 })
    } catch (error) {
        console.error('Failed to create collection:', error)
        return NextResponse.json(
            { error: 'Failed to create collection' },
            { status: 500 }
        )
    }
}
