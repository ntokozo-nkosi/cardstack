'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Flashcard } from '@/components/flashcard'
import { AnimatePresence, motion } from 'framer-motion'

interface Card {
  id: string
  front: string
  back: string
}

interface Deck {
  id: string
  name: string
  cards: Card[]
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const variants = {
  enter: () => ({
    x: 0,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction === 1 ? 500 : -500,
    opacity: 0,
    rotate: direction === 1 ? 20 : -20,
    transition: { duration: 0.3 }
  })
}

export default function StudyModePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [deck, setDeck] = useState<Deck | null>(null)
  const [queue, setQueue] = useState<Card[]>([])
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exitDirection, setExitDirection] = useState(0) // 0=none, 1=right(correct), -1=left(wrong)

  const fetchDeck = useCallback(async () => {
    try {
      const response = await fetch(`/api/decks/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch deck')
      }
      const data = await response.json()
      setDeck(data)
      setQueue(shuffleArray(data.cards))
    } catch (error) {
      console.error('Error fetching deck:', error)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchDeck()
  }, [fetchDeck])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleCorrect = () => {
    setExitDirection(1)
    // Remove current card from queue
    setQueue((prev) => prev.slice(1))
    setIsFlipped(false)
  }

  const handleIncorrect = () => {
    setExitDirection(-1)
    // Move current card to end of queue
    setQueue((prev) => {
      const current = prev[0]
      if (!current) return prev
      return [...prev.slice(1), current]
    })
    setIsFlipped(false)
  }

  // Reload/Restart handler if needed, or just navigation

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading deck...</p>
      </div>
    )
  }

  if (!deck || (queue.length === 0 && loading)) {
    // simplified check, if queue is empty AND not loading, it means we finished? 
    // or if deck was empty to begin with.
    // If deck has 0 cards initially:
    if (deck && deck.cards.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-muted-foreground mb-4">
              This deck has no cards to study.
            </p>
            <Button asChild>
              <Link href={`/decks/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Deck
              </Link>
            </Button>
          </div>
        </div>
      )
    }
  }

  // Completion state
  if (queue.length === 0 && deck && deck.cards.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">All Cached Up!</h2>
          <p className="text-muted-foreground mb-8">
            You&apos;ve gone through all the cards in this session.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href={`/decks/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Deck
              </Link>
            </Button>
            <Button onClick={() => setQueue(shuffleArray(deck.cards))}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentCard = queue[0]

  return (
    <div className="h-[calc(100dvh-56px)] md:h-dvh flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6 shrink-0">
        <Link
          href={`/decks/${id}`}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-muted/50"
          aria-label="Exit"
        >
          <X className="h-6 w-6" />
        </Link>

        <p className="text-sm font-medium text-muted-foreground">
          {queue.length} remaining
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 min-h-0 relative">
        <div className="w-full max-w-2xl relative perspective-1000">
          <AnimatePresence mode="wait" custom={exitDirection}>
            {currentCard && (
              <motion.div
                key={currentCard.id}
                custom={exitDirection}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="w-full"
              >
                <Flashcard
                  front={currentCard.front}
                  back={currentCard.back}
                  isFlipped={isFlipped}
                  onFlip={handleFlip}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-2 pb-8 sm:p-8 shrink-0 min-h-[100px]">
        <div className="flex justify-center gap-4 transition-opacity duration-200" style={{ opacity: isFlipped ? 1 : 0, pointerEvents: isFlipped ? 'auto' : 'none' }}>
          <Button
            variant="destructive"
            size="lg"
            onClick={handleIncorrect}
            className="flex-1 sm:flex-none sm:w-40"
          >
            I got it wrong
          </Button>
          <Button
            variant="default" // Green-ish usually, default is primary. Maybe I should style it green?
            size="lg"
            onClick={handleCorrect}
            className="flex-1 sm:flex-none sm:w-40 bg-green-600 hover:bg-green-700 text-white"
          >
            I got it right
          </Button>
        </div>
      </div>
    </div>
  )
}
