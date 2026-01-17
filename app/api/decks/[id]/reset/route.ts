import { NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getCurrentUserDb } from '@/lib/auth-helpers'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserDb()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params

    const result = await query(
      'SELECT reset_deck_cards($1, $2) as result',
      [id, user.id]
    )

    const response = result.rows[0]?.result

    if (!response?.success) {
      return NextResponse.json(
        { error: response?.error || 'Failed to reset deck' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      resetCount: response.resetCount
    })
  } catch (error) {
    console.error('Failed to reset deck:', error)
    return NextResponse.json(
      { error: 'Failed to reset deck' },
      { status: 500 }
    )
  }
}
