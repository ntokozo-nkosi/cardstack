import { NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Fetch collection details
        const collectionResult = await query(
            `SELECT id, name, description, created_at as "createdAt"
       FROM collections 
       WHERE id = $1`,
            [id]
        )

        if (collectionResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Collection not found' },
                { status: 404 }
            )
        }

        const collection = collectionResult.rows[0]

        // Fetch decks in this collection
        const decksResult = await query(
            `SELECT 
        d.id,
        d.name,
        d.description,
        d.created_at as "createdAt",
        COUNT(c.id)::int as "_count"
      FROM decks d
      JOIN collection_decks cd ON cd.deck_id = d.id
      LEFT JOIN cards c ON c.deck_id = d.id
      WHERE cd.collection_id = $1
      GROUP BY d.id, cd.added_at
      ORDER BY cd.added_at DESC`,
            [id]
        )

        const decks = decksResult.rows.map(row => ({
            ...row,
            _count: { cards: row._count }
        }))

        return NextResponse.json({ ...collection, decks })
    } catch (error) {
        console.error('Failed to fetch collection:', error)
        return NextResponse.json(
            { error: 'Failed to fetch collection' },
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
            `UPDATE collections 
       SET name = $1, description = $2 
       WHERE id = $3 
       RETURNING id, name, description, created_at as "createdAt"`,
            [name.trim(), description?.trim() || null, id]
        )

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Collection not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(result.rows[0])
    } catch (error) {
        console.error('Failed to update collection:', error)
        return NextResponse.json(
            { error: 'Failed to update collection' },
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

        // Check if collection exists
        const checkResult = await query(
            'SELECT id FROM collections WHERE id = $1',
            [id]
        )

        if (checkResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Collection not found' },
                { status: 404 }
            )
        }

        // Delete collection (cascade will handle collection_decks)
        await query('DELETE FROM collections WHERE id = $1', [id])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete collection:', error)
        return NextResponse.json(
            { error: 'Failed to delete collection' },
            { status: 500 }
        )
    }
}
