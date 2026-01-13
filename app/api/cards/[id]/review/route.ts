import { NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getCurrentUserDb } from '@/lib/auth-helpers'

const VALID_RESPONSES = ['again', 'hard', 'good', 'easy'] as const
type ReviewResponse = (typeof VALID_RESPONSES)[number]

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
    const { response } = body

    if (!response || !VALID_RESPONSES.includes(response as ReviewResponse)) {
      return NextResponse.json(
        { error: 'Invalid response. Must be one of: again, hard, good, easy' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT record_card_review_sm2($1, $2, $3) as result',
      [id, user.id, response]
    )

    const reviewResult = result.rows[0]?.result

    if (!reviewResult?.success) {
      return NextResponse.json(
        { error: reviewResult?.error || 'Card not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json(reviewResult)
  } catch (error) {
    console.error('Failed to record card review:', error)
    return NextResponse.json(
      { error: 'Failed to record review' },
      { status: 500 }
    )
  }
}
