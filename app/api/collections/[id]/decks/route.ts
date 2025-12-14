import { NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { deckId } = body

        if (!deckId) {
            return NextResponse.json(
                { error: 'Deck ID is required' },
                { status: 400 }
            )
        }

        await query(
            `INSERT INTO collection_decks (collection_id, deck_id) 
       VALUES ($1, $2)
       ON CONFLICT (collection_id, deck_id) DO NOTHING`,
            [id, deckId]
        )

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
        const { id } = await params
        const body = await request.json()
        const { deckId } = body

        if (!deckId) {
            return NextResponse.json(
                { error: 'Deck ID is required' },
                { status: 400 }
            )
        }

        await query(
            `DELETE FROM collection_decks 
       WHERE collection_id = $1 AND deck_id = $2`,
            [id, deckId]
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to remove deck from collection:', error)
        return NextResponse.json(
            { error: 'Failed to remove deck from collection' },
            { status: 500 }
        )
    }
}
