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
    const { name, description } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT create_deck_in_collection_if_owned($1, $2, $3, $4) as deck',
      [id, user.id, name.trim(), description?.trim() || null]
    )

    const deck = result.rows[0]?.deck

    return NextResponse.json(deck, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('Collection not found')) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      )
    }
    console.error('Error creating deck in collection:', error)
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    )
  }
}
