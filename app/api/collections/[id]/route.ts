import { NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getCurrentUserDb } from '@/lib/auth-helpers'

export async function GET(
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
            'SELECT get_collection_with_decks($1, $2) as collection',
            [id, user.id]
        )

        const collection = result.rows[0]?.collection

        if (!collection) {
            return NextResponse.json(
                { error: 'Collection not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(collection)
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
        const user = await getCurrentUserDb()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

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
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, description, created_at as "createdAt"`,
            [name.trim(), description?.trim() || null, id, user.id]
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
        const user = await getCurrentUserDb()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { id } = await params

        // Check if collection exists and is owned by user
        const checkResult = await query(
            'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
            [id, user.id]
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
