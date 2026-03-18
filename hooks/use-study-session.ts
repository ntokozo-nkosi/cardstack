'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

export interface Card {
  id: string
  front: string
  back: string
  lastResponse?: string
  lastReviewedAt?: string
  reviewCount?: number
  repetitions?: number
  easeFactor?: number
  intervalDays?: number
  dueDate?: string
  isNew?: boolean
}

export type ReviewResponse = 'again' | 'hard' | 'good' | 'easy'

export interface Deck {
  id: string
  name: string
  cards: Card[]
}

export interface UseStudySessionReturn {
  deck: Deck | null
  queue: Card[]
  currentCard: Card | undefined
  totalCardsInSession: number
  completedCount: number
  isFlipped: boolean
  loading: boolean
  direction: number
  showAllCards: boolean
  progress: number
  setShowAllCards: (val: boolean) => void
  handleFlip: () => void
  handleResponse: (response: ReviewResponse) => void
  fetchDeck: () => void
}

export function useStudySession({ deckId }: { deckId: string }): UseStudySessionReturn {
  const router = useRouter()

  const [deck, setDeck] = useState<Deck | null>(null)
  const [queue, setQueue] = useState<Card[]>([])
  const [totalCardsInSession, setTotalCardsInSession] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(0)
  const [showAllCards, setShowAllCards] = useState(false)

  const isProcessingRef = useRef(false)

  const fetchDeck = useCallback(async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch deck')
      }
      const data = await response.json()
      setDeck(data)

      let cardsToStudy = data.cards

      if (!showAllCards) {
        const now = new Date()
        cardsToStudy = data.cards.filter((card: Card) => {
          if (!card.dueDate) return true
          return new Date(card.dueDate) <= now
        })
      }

      cardsToStudy.sort((a: Card, b: Card) => {
        const aDue = a.dueDate ? new Date(a.dueDate) : new Date()
        const bDue = b.dueDate ? new Date(b.dueDate) : new Date()
        return aDue.getTime() - bDue.getTime()
      })

      setQueue(cardsToStudy)
      setTotalCardsInSession(cardsToStudy.length)
      setCompletedCount(0)
    } catch (error) {
      console.error('Error fetching deck:', error)
    } finally {
      setLoading(false)
    }
  }, [deckId, router, showAllCards])

  useEffect(() => {
    fetchDeck()
  }, [fetchDeck])

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev)
  }, [])

  const recordReview = useCallback(async (cardId: string, response: ReviewResponse) => {
    try {
      await fetch(`/api/cards/${cardId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      })
    } catch (error) {
      console.error('Failed to record review:', error)
    }
  }, [])

  const handleResponse = useCallback((response: ReviewResponse) => {
    if (isProcessingRef.current) return
    const currentCard = queue[0]
    if (!currentCard) return

    isProcessingRef.current = true

    recordReview(currentCard.id, response)

    if (response === 'again') {
      setDirection(-1)
      setTimeout(() => {
        setQueue((prev) => {
          const current = prev[0]
          if (!current) return prev

          let minPos = 3
          let maxPos = 7

          if (prev.length <= 5) {
            minPos = Math.max(1, prev.length - 2)
            maxPos = prev.length
          } else if (prev.length <= 15) {
            minPos = 3
            maxPos = 7
          } else {
            minPos = 5
            maxPos = 10
          }

          const insertPosition = Math.floor(Math.random() * (maxPos - minPos + 1)) + minPos
          const safePosition = Math.min(insertPosition, prev.length)

          return [
            ...prev.slice(1, safePosition),
            current,
            ...prev.slice(safePosition)
          ]
        })
        setIsFlipped(false)
        setDirection(0)
        isProcessingRef.current = false
      }, 200)
    } else {
      setDirection(1)
      setTimeout(() => {
        setQueue((prev) => prev.slice(1))
        setCompletedCount(prev => prev + 1)
        setIsFlipped(false)
        setDirection(0)
        isProcessingRef.current = false
      }, 200)
    }
  }, [queue, recordReview])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (queue.length === 0) return

      if (e.code === 'Space') {
        e.preventDefault()
        handleFlip()
      } else if (isFlipped) {
        if (e.key === '1' || e.key === 'ArrowLeft') {
          handleResponse('again')
        } else if (e.key === '2') {
          handleResponse('hard')
        } else if (e.key === '3') {
          handleResponse('good')
        } else if (e.key === '4' || e.key === 'ArrowRight') {
          handleResponse('easy')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [queue.length, isFlipped, handleFlip, handleResponse])

  const progress = totalCardsInSession > 0 ? (completedCount / totalCardsInSession) * 100 : 0
  const currentCard = queue[0]

  return {
    deck,
    queue,
    currentCard,
    totalCardsInSession,
    completedCount,
    isFlipped,
    loading,
    direction,
    showAllCards,
    progress,
    setShowAllCards,
    handleFlip,
    handleResponse,
    fetchDeck,
  }
}
