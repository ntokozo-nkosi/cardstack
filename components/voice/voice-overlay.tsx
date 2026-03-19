'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { VOICE_TOOL_DEFINITIONS, executeToolCall } from '@/lib/voice/tools'
import { VOICE_AGENT_INSTRUCTIONS, buildCardContext } from '@/lib/voice/instructions'
import type { Card, ReviewResponse } from '@/hooks/use-study-session'
import type { VoiceToolCallbacks } from '@/lib/voice/tools'

type VoiceState = 'idle' | 'connecting' | 'connected' | 'error'

interface VoiceOverlayProps {
  currentCard: Card | undefined
  isFlipped?: boolean
  queueLength: number
  onFlip: () => void
  onResponse: (response: ReviewResponse) => void
  /** Render as inline button (inside footer) instead of fixed position */
  inline?: boolean
}

export function VoiceOverlay({
  currentCard,
  queueLength,
  onFlip,
  onResponse,
  inline = false,
}: VoiceOverlayProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const prevCardIdRef = useRef<string | undefined>(undefined)
  const responseActiveRef = useRef(false)
  const pendingCardContextRef = useRef<string | null>(null)

  // Keep callbacks in a ref so the data channel handler always sees latest props
  const callbacksRef = useRef<VoiceToolCallbacks>({
    onFlip,
    onRate: onResponse,
    onEnd: () => {},
  })
  callbacksRef.current = {
    onFlip,
    onRate: onResponse,
    onEnd: () => {
      disconnect()
      toast.success('Voice mode ended')
    },
  }

  const disconnect = useCallback(() => {
    if (dcRef.current) {
      dcRef.current.close()
      dcRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    setVoiceState('idle')
  }, [])

  /** Send a client event over the data channel */
  const sendEvent = useCallback((event: Record<string, unknown>) => {
    const dc = dcRef.current
    if (dc && dc.readyState === 'open') {
      dc.send(JSON.stringify(event))
    }
  }, [])

  /** Send a conversation message and trigger a response, queuing if one is already active */
  const sendMessage = useCallback(
    (text: string) => {
      if (responseActiveRef.current) {
        // Queue until the current response finishes
        pendingCardContextRef.current = text
        return
      }
      responseActiveRef.current = true
      sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }],
        },
      })
      sendEvent({ type: 'response.create' })
    },
    [sendEvent]
  )

  /** Flush any queued card context after a response completes */
  const flushPendingContext = useCallback(() => {
    responseActiveRef.current = false
    const pending = pendingCardContextRef.current
    if (pending) {
      pendingCardContextRef.current = null
      sendMessage(pending)
    }
  }, [sendMessage])

  const connect = useCallback(async () => {
    if (voiceState === 'connecting' || voiceState === 'connected') {
      disconnect()
      toast.info('Voice mode disconnected')
      return
    }

    setVoiceState('connecting')

    try {
      // 1. Get ephemeral key
      const res = await fetch('/api/realtime/session', { method: 'POST' })
      if (!res.ok) {
        throw new Error(`Failed to get session key: ${res.status}`)
      }
      const { clientSecret } = await res.json()

      // 2. Create peer connection
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // 3. Set up remote audio playback
      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0]
      }

      // 4. Get microphone with echo cancellation to prevent agent voice feedback
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      ms.getTracks().forEach((track) => pc.addTrack(track, ms))

      // 5. Create data channel for events
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      let sessionConfigured = false

      dc.onopen = () => {
        // Build instructions with first card context
        let instructions = VOICE_AGENT_INSTRUCTIONS
        if (currentCard) {
          instructions += `\n\nHere is the first card to study:\n${buildCardContext(currentCard, queueLength)}`
          prevCardIdRef.current = currentCard.id
        }

        // Configure session with tools and instructions (GA format)
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            type: 'realtime',
            instructions,
            tools: VOICE_TOOL_DEFINITIONS,
            tool_choice: 'auto',
            audio: {
              output: {
                speed: 0.9,
              },
            },
          },
        }))
      }

      dc.onmessage = (e) => {
        const event = JSON.parse(e.data)

        // Once session is configured, trigger the agent to speak first
        if (event.type === 'session.updated' && !sessionConfigured) {
          sessionConfigured = true
          dc.send(JSON.stringify({ type: 'response.create' }))
        }

        // Track response lifecycle
        if (event.type === 'response.created') {
          responseActiveRef.current = true
        }
        if (event.type === 'response.done') {
          flushPendingContext()
        }

        // Handle tool calls
        if (event.type === 'response.function_call_arguments.done') {
          const result = executeToolCall(
            event.name,
            event.arguments,
            callbacksRef.current
          )
          sendEvent({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: event.call_id,
              output: result,
            },
          })
          // Only trigger response.create for non-rate tools.
          // For rate_card, the next card context from the useEffect
          // will send response.create — avoids the agent speaking
          // before it has the next card.
          if (event.name !== 'rate_card') {
            sendEvent({ type: 'response.create' })
          }
        }

        if (event.type === 'error') {
          console.error('[Voice] Error:', event.error)
        }
      }

      dc.onclose = () => {
        console.log('[Voice] Data channel closed')
      }

      // 6. SDP exchange
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch(
        'https://api.openai.com/v1/realtime/calls',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${clientSecret}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      )

      if (!sdpRes.ok) {
        throw new Error(`SDP negotiation failed: ${sdpRes.status}`)
      }

      const answerSdp = await sdpRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      setVoiceState('connected')
      toast.success('Voice mode connected')
    } catch (err) {
      console.error('[Voice] Connection failed:', err)
      disconnect()
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access required for voice mode'
          : 'Failed to connect voice mode'
      toast.error(message)
      setVoiceState('idle')
    }
  }, [voiceState, disconnect, currentCard, queueLength, sendEvent, flushPendingContext])

  // Send updated card context when current card changes
  useEffect(() => {
    if (
      voiceState !== 'connected' ||
      !dcRef.current ||
      !currentCard ||
      currentCard.id === prevCardIdRef.current
    ) {
      return
    }

    const timer = setTimeout(() => {
      if (!dcRef.current || dcRef.current.readyState !== 'open') return

      if (queueLength === 0) {
        sendMessage(
          'All cards reviewed! Congratulate the student and say goodbye, then call end_session.'
        )
      } else {
        sendMessage(buildCardContext(currentCard, queueLength))
      }
      prevCardIdRef.current = currentCard.id
    }, 300)

    return () => clearTimeout(timer)
  }, [currentCard, currentCard?.id, queueLength, voiceState, sendMessage])

  // Handle queue exhaustion
  useEffect(() => {
    if (
      voiceState === 'connected' &&
      dcRef.current &&
      !currentCard &&
      queueLength === 0
    ) {
      sendMessage(
        'All cards reviewed! Congratulate the student and say goodbye, then call end_session.'
      )
    }
  }, [currentCard, queueLength, voiceState, sendMessage])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      dcRef.current?.close()
      pcRef.current?.close()
    }
  }, [])

  const isActive = voiceState === 'connected' || voiceState === 'connecting'

  return (
    <Button
      size="icon"
      onClick={connect}
      aria-label={isActive ? 'Disconnect voice mode' : 'Start voice mode'}
      className={`
        rounded-full shadow-lg transition-all duration-200
        ${
          inline
            ? 'h-14 w-14'
            : 'fixed z-50 bottom-6 right-6 h-12 w-12'
        }
        ${
          voiceState === 'connected'
            ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)]'
            : voiceState === 'connecting'
              ? 'bg-primary/80 text-primary-foreground'
              : voiceState === 'error'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }
      `}
    >
      {voiceState === 'connecting' && (
        <span className="absolute inset-0 rounded-full animate-ping bg-primary/40" />
      )}
      {isActive ? (
        <Mic className={inline ? 'h-6 w-6' : 'h-5 w-5'} />
      ) : (
        <MicOff className={inline ? 'h-6 w-6' : 'h-5 w-5'} />
      )}
    </Button>
  )
}
