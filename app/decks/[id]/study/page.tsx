'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, X, Check, Trophy, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Flashcard } from '@/components/flashcard'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
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
    x: direction < 0 ? -100 : 100,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  })
}

export default function StudyModePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [deck, setDeck] = useState<Deck | null>(null)
  const [queue, setQueue] = useState<Card[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(0)

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
      setCompletedCount(0)
    } catch (error) {
      console.error('Error fetching deck:', error)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchDeck()
  }, [fetchDeck])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (queue.length === 0) return

      if (e.code === 'Space') {
        e.preventDefault()
        handleFlip()
      } else if (isFlipped) {
        if (e.key === '1' || e.key === 'ArrowLeft') {
          handleIncorrect()
        } else if (e.key === '2' || e.key === 'ArrowRight') {
          handleCorrect()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [queue.length, isFlipped])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleCorrect = () => {
    setDirection(1)
    setTimeout(() => {
      setQueue((prev) => prev.slice(1))
      setCompletedCount(prev => prev + 1)
      setIsFlipped(false)
      setDirection(0)
    }, 200) // Slight delay to allow animation state update if needed, though with AnimatePresence it handles exit
  }

  const handleIncorrect = () => {
    setDirection(-1)
    setTimeout(() => {
      setQueue((prev) => {
        const current = prev[0]
        if (!current) return prev
        return [...prev.slice(1), current]
      })
      setIsFlipped(false)
      setDirection(0)
    }, 200)
  }

  // Calculate progress
  const totalCards = deck?.cards.length || 0
  // In a reshuffle queue (handleIncorrect moves to back), progress is weird. 
  // Let's simpler visualize "Remaining" vs "Total".
  const progress = totalCards > 0 ? ((totalCards - queue.length) / totalCards) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="space-y-4 w-full max-w-md">
          <div className="h-4 w-1/3 bg-muted rounded mx-auto animate-pulse" />
          <div className="aspect-[3/2] w-full bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  // Deck empty state
  if (deck && deck.cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <X className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">No cards to study</h3>
            <p className="text-muted-foreground">
              This deck is empty. Add some cards to get started.
            </p>
          </div>
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

  // Completion state
  if (queue.length === 0 && deck && deck.cards.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full space-y-8 animate-in zoom-in-95 duration-300">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-yellow-100 rounded-full animate-pulse" />
            <div className="relative flex items-center justify-center w-full h-full bg-yellow-50 rounded-full border-4 border-yellow-100">
              <Trophy className="w-10 h-10 text-yellow-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Session Complete!</h2>
            <p className="text-muted-foreground">
              You've reviewed all {deck.cards.length} cards in this deck.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild variant="outline" size="lg">
              <Link href={`/decks/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Deck
              </Link>
            </Button>
            <Button size="lg" onClick={() => {
              setQueue(shuffleArray(deck.cards))
              setCompletedCount(0)
            }}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Study Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentCard = queue[0]

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link
          href={`/decks/${id}`}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-muted"
          aria-label="Exit study mode"
        >
          <X className="h-5 w-5" />
        </Link>

        <div className="flex-1 max-w-sm mx-4">
          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
            <span>Progress</span>
            <span>{completedCount} / {deck?.cards.length}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="w-9" /> {/* Spacer for centering if needed, or help button */}
      </header>

      {/* Main Card Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative">
        <div className="w-full max-w-2xl aspect-[3/2] relative perspective-1000">
          <AnimatePresence mode="popLayout" custom={direction}>
            {currentCard && (
              <motion.div
                key={currentCard.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 }
                }}
                className="w-full h-full absolute inset-0"
                style={{ zIndex: queue.length }}
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

        {/* Keyboard Hints */}
        <div className="hidden lg:flex items-center gap-6 mt-8 text-xs text-muted-foreground font-medium opacity-50">
          <span className="flex items-center gap-1.5"><Keyboard className="w-3 h-3" /> Shortcuts</span>
          <span className="flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">Space</kbd> Flip</span>
          <span className="flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">1</kbd> Wrong</span>
          <span className="flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">2</kbd> Right</span>
        </div>
      </main>

      {/* Footer / Controls */}
      <footer className="p-6 md:p-8 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 transition-all duration-300"
          style={{
            opacity: isFlipped ? 1 : 0.5,
            pointerEvents: isFlipped ? 'auto' : 'none',
            transform: isFlipped ? 'translateY(0)' : 'translateY(10px)'
          }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={handleIncorrect}
            className="flex-1 h-14 text-base font-medium border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <X className="mr-2 h-5 w-5" />
            Got it wrong
          </Button>

          <Button
            size="lg"
            onClick={handleCorrect}
            className="flex-1 h-14 text-base font-medium bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-md hover:shadow-lg transition-all"
          >
            <Check className="mr-2 h-5 w-5" />
            Got it right
          </Button>
        </div>
      </footer>
    </div>
  )
}
