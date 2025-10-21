import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(
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

    const card = await prisma.card.update({
      where: { id },
      data: {
        front: front.trim(),
        back: back.trim()
      }
    })

    return NextResponse.json(card)
  } catch (error) {
    console.error('Failed to update card:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
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

    await prisma.card.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete card:', error)
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    )
  }
}
