import { NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getCurrentUserDb } from '@/lib/auth-helpers'
import { COLOR_THEMES, VALID_MODES } from '@/lib/themes'

const VALID_COLOR_THEME_IDS = COLOR_THEMES.map((t) => t.id)

export async function GET() {
  try {
    const user = await getCurrentUserDb()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const result = await query(
      'SELECT * FROM get_or_create_user_settings($1)',
      [user.id]
    )

    return NextResponse.json({ settings: result.rows[0]?.settings ?? {} })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUserDb()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }
    const validated: Record<string, string> = {}

    if (body.color_theme !== undefined) {
      if (!VALID_COLOR_THEME_IDS.includes(body.color_theme)) {
        return NextResponse.json(
          { error: 'Invalid color_theme' },
          { status: 400 }
        )
      }
      validated.color_theme = body.color_theme
    }

    if (body.mode !== undefined) {
      if (!VALID_MODES.includes(body.mode)) {
        return NextResponse.json(
          { error: 'Invalid mode' },
          { status: 400 }
        )
      }
      validated.mode = body.mode
    }

    if (Object.keys(validated).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings provided' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT * FROM update_user_settings($1, $2)',
      [user.id, JSON.stringify(validated)]
    )

    return NextResponse.json({ settings: result.rows[0]?.settings ?? {} })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
