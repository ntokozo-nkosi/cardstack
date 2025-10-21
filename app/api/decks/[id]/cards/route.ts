import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { front, back } = body

    if (!front || front.trim() === '') {
      return NextResponse.json(
        { error: 'Front is required' },
        { status: 400 }
      )
    }

    if (!back || back.trim() === '') {
      return NextResponse.json(
        { error: 'Back is required' },
        { status: 400 }
      )
    }

    const card = await prisma.card.create({
      data: {
        deckId: id,
        front: front.trim(),
        back: back.trim()
      }
    })

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error('Failed to create card:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
}
