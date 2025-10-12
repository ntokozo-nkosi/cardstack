import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const decks = await prisma.deck.findMany({
      include: {
        _count: {
          select: { cards: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(decks)
  } catch (error) {
    console.error('Failed to fetch decks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const deck = await prisma.deck.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    })

    return NextResponse.json(deck, { status: 201 })
  } catch (error) {
    console.error('Failed to create deck:', error)
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    )
  }
}
