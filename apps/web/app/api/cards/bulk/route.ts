import { NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getCurrentUserDb } from '@/lib/auth-helpers'

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUserDb()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { cardIds } = body

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json(
        { error: 'Card IDs array is required' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT bulk_delete_cards_if_owned($1, $2) as deleted_count',
      [cardIds, user.id]
    )

    const deletedCount = result.rows[0]?.deleted_count || 0

    return NextResponse.json({ deletedCount })
  } catch (error) {
    console.error('Failed to bulk delete cards:', error)
    return NextResponse.json(
      { error: 'Failed to delete cards' },
      { status: 500 }
    )
  }
}
