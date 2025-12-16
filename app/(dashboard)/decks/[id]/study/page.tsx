'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, X, Check, Trophy, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped)
  }, [isFlipped])

  const handleCorrect = useCallback(() => {
    setDirection(1)
    setTimeout(() => {
      setQueue((prev) => prev.slice(1))
      setCompletedCount(prev => prev + 1)
      setIsFlipped(false)
      setDirection(0)
    }, 200)
  }, [])

  const handleIncorrect = useCallback(() => {
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
  }, [])

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
  }, [queue.length, isFlipped, handleFlip, handleCorrect, handleIncorrect])

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
      <div className="mx-auto w-full max-w-2xl px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full text-center">
          <div className="relative mb-8 mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-full animate-pulse blur-xl" />
            <div className="relative flex items-center justify-center w-full h-full bg-background rounded-full border-4 border-yellow-100 dark:border-yellow-900/30 shadow-inner">
              <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-500" />
            </div>
          </div>

          <div className="space-y-3 mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Session Complete!</h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              You&apos;ve successfully reviewed all <span className="font-semibold text-foreground">{deck.cards.length}</span> cards.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm mx-auto">
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link href={`/decks/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Deck
              </Link>
            </Button>
            <Button size="lg" className="flex-1 shadow-md" onClick={() => {
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
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Link
          href={`/decks/${id}`}
          className="group inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Deck
        </Link>

        <div className="flex-1 max-w-xs sm:mx-8 w-full">
          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{completedCount} of {deck?.cards.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="hidden sm:block w-[100px]" /> {/* Spacer for balance */}
      </header>

      {/* Main Card Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full relative min-h-[400px]">
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
        <div className="hidden lg:flex items-center gap-8 mt-12 text-xs font-medium text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground opacity-100 px-1.5">Space</kbd>
            <span>Flip Card</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground opacity-100 px-1.5">1</kbd>
            <span>Got it wrong</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground opacity-100 px-1.5">2</kbd>
            <span>Got it right</span>
          </div>
        </div>
      </main>

      {/* Footer / Controls */}
      <footer className="mt-8 mb-4">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-4 transition-all duration-300"
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
            className="flex-1 h-12 text-base border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive active:scale-95 transition-all"
          >
            <X className="mr-2 h-4 w-4" />
            Got it wrong
          </Button>

          <Button
            size="lg"
            onClick={handleCorrect}
            className="flex-1 h-12 text-base active:scale-95 transition-all shadow-sm"
          >
            <Check className="mr-2 h-4 w-4" />
            Got it right
          </Button>
        </div>
      </footer>
    </div>
  )
}
