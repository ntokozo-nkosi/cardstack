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
        const { deckId } = body

        if (!deckId) {
            return NextResponse.json(
                { error: 'Deck ID is required' },
                { status: 400 }
            )
        }

        const result = await query(
            'SELECT add_deck_to_collection_if_owned($1, $2, $3) as status',
            [id, deckId, user.id]
        )

        const status = result.rows[0]?.status

        if (status === 'COLLECTION_NOT_FOUND') {
            return NextResponse.json(
                { error: 'Collection not found' },
                { status: 404 }
            )
        }

        if (status === 'DECK_NOT_FOUND') {
            return NextResponse.json(
                { error: 'Deck not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true }, { status: 201 })
    } catch (error) {
        console.error('Failed to add deck to collection:', error)
        return NextResponse.json(
            { error: 'Failed to add deck to collection' },
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
        const body = await request.json()
        const { deckId } = body

        if (!deckId) {
            return NextResponse.json(
                { error: 'Deck ID is required' },
                { status: 400 }
            )
        }

        const result = await query(
            'SELECT remove_deck_from_collection_if_owned($1, $2, $3) as status',
            [id, deckId, user.id]
        )

        const status = result.rows[0]?.status

        if (status === 'COLLECTION_NOT_FOUND') {
            return NextResponse.json(
                { error: 'Collection not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to remove deck from collection:', error)
        return NextResponse.json(
            { error: 'Failed to remove deck from collection' },
            { status: 500 }
        )
    }
}

