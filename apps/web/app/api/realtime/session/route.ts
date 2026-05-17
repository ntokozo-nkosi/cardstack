import { NextResponse } from 'next/server'
import { getCurrentUserDb } from '@/lib/auth-helpers'

export async function POST() {
  const user = await getCurrentUserDb()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    )
  }

  try {
    // GA endpoint for ephemeral keys
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime-1.5',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI ephemeral key error:', error)
      return NextResponse.json(
        { error: 'Failed to create realtime session' },
        { status: 502 }
      )
    }

    const data = await response.json()
    // GA response: { value: "ek_...", expires_at: ... }
    return NextResponse.json({ clientSecret: data.value })
  } catch (error) {
    console.error('Ephemeral key request failed:', error)
    return NextResponse.json(
      { error: 'Failed to create realtime session' },
      { status: 500 }
    )
  }
}
