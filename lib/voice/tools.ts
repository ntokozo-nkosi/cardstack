import type { ReviewResponse } from '@/hooks/use-study-session'

export interface VoiceToolCallbacks {
  onFlip: () => void
  onRate: (rating: ReviewResponse) => void
  onEnd: () => void
}

// Tool definitions sent to the OpenAI Realtime API session config
export const VOICE_TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    name: 'flip_card',
    description: 'Flip the flashcard to show/hide the answer.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    type: 'function' as const,
    name: 'rate_card',
    description:
      'Rate the user answer and advance to the next card. again=wrong, hard=barely knew, good=knew it, easy=too easy.',
    parameters: {
      type: 'object',
      properties: {
        rating: {
          type: 'string',
          enum: ['again', 'hard', 'good', 'easy'],
          description: 'The rating for the user answer.',
        },
      },
      required: ['rating'],
    },
  },
  {
    type: 'function' as const,
    name: 'end_session',
    description:
      'End the voice study session when the user wants to stop or all cards are done.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

/** Execute a tool call from the realtime API and return the string result */
export function executeToolCall(
  name: string,
  args: string,
  callbacks: VoiceToolCallbacks
): string {
  switch (name) {
    case 'flip_card':
      callbacks.onFlip()
      return 'Card flipped.'
    case 'rate_card': {
      const { rating } = JSON.parse(args)
      callbacks.onRate(rating as ReviewResponse)
      return `Rated "${rating}". Moving to next card.`
    }
    case 'end_session':
      callbacks.onEnd()
      return 'Session ended.'
    default:
      return `Unknown tool: ${name}`
  }
}
