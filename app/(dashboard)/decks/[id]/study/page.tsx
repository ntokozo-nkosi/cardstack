'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, X, Check, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Flashcard } from '@/components/flashcard'
import { AnimatePresence, motion } from 'framer-motion'
import { ModeToggle } from '@/components/mode-toggle'

interface Card {
  id: string
  front: string
  back: string
  lastResponse?: string
  lastReviewedAt?: string
  reviewCount?: number
  // SM-2 fields
  repetitions?: number
  easeFactor?: number
  intervalDays?: number
  dueDate?: string
  isNew?: boolean
}

type ReviewResponse = 'again' | 'hard' | 'good' | 'easy'

interface Deck {
  id: string
  name: string
  cards: Card[]
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
  const [totalCardsInSession, setTotalCardsInSession] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(0)
  const [showAllCards, setShowAllCards] = useState(false)

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

      // Filter cards based on toggle
      let cardsToStudy = data.cards

      if (!showAllCards) {
        // Show only cards that are due (due_date <= now)
        const now = new Date()
        cardsToStudy = data.cards.filter((card: Card) => {
          if (!card.dueDate) return true  // New cards with no due date
          return new Date(card.dueDate) <= now
        })
      }

      // Sort: due cards first (by how overdue), then new cards
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
  }, [id, router, showAllCards])

  useEffect(() => {
    fetchDeck()
  }, [fetchDeck])

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped)
  }, [isFlipped])

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
    const currentCard = queue[0]
    if (!currentCard) return

    // Fire and forget - don't block UI
    recordReview(currentCard.id, response)

    // Always remove card from queue - SM-2 determines when it's due next
    setDirection(1)
    setTimeout(() => {
      setQueue((prev) => prev.slice(1))
      setCompletedCount(prev => prev + 1)
      setIsFlipped(false)
      setDirection(0)
    }, 200)
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

  // Calculate progress based on cards reviewed in this session
  const progress = totalCardsInSession > 0 ? (completedCount / totalCardsInSession) * 100 : 0

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
    const totalCards = deck.cards.length
    const dueCards = deck.cards.filter(c =>
      !c.dueDate || new Date(c.dueDate) <= new Date()
    ).length

    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full text-center space-y-6">
          <div className="relative mb-8 mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-full animate-pulse blur-xl" />
            <div className="relative flex items-center justify-center w-full h-full bg-background rounded-full border-4 border-yellow-100 dark:border-yellow-900/30 shadow-inner">
              <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">All done for now!</h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              {showAllCards
                ? `You've reviewed all ${totalCards} cards in this deck.`
                : dueCards === 0
                  ? `No cards are due right now. Come back later!`
                  : `You've reviewed all due cards.`
              }
            </p>
          </div>

          {!showAllCards && deck.cards.length > dueCards && (
            <Button
              variant="outline"
              onClick={() => setShowAllCards(true)}
            >
              Study all cards ({deck.cards.length} total)
            </Button>
          )}

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto mt-8">
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href={`/decks/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Deck
              </Link>
            </Button>
            <Button size="lg" className="w-full shadow-md" onClick={() => {
              setShowAllCards(false)
              fetchDeck()
            }}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
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

        <div className="flex items-center gap-4">
          {/* Study mode toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllCards(!showAllCards)}
            className="text-xs"
          >
            {showAllCards ? 'Due cards only' : 'Study all cards'}
          </Button>

          <div className="flex-1 max-w-xs sm:mx-8 w-full">
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{completedCount} of {totalCardsInSession}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="hidden sm:flex w-[100px] justify-end">
            <ModeToggle />
          </div>
        </div>
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
        <div className="hidden lg:flex items-center gap-6 mt-12 text-xs font-medium text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <kbd className="h-5 items-center gap-1 rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground opacity-100 px-1.5">Space</kbd>
            <span>Flip</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <kbd className="h-5 items-center gap-1 rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground opacity-100 px-1.5">1</kbd>
            <span>Again</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="h-5 items-center gap-1 rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground opacity-100 px-1.5">2</kbd>
            <span>Hard</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="h-5 items-center gap-1 rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground opacity-100 px-1.5">3</kbd>
            <span>Good</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="h-5 items-center gap-1 rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground opacity-100 px-1.5">4</kbd>
            <span>Easy</span>
          </div>
        </div>
      </main>

      {/* Footer / Controls */}
      <footer className="mt-8 mb-4">
        <div className="max-w-2xl mx-auto grid grid-cols-4 gap-2 sm:gap-3 transition-all duration-300"
          style={{
            opacity: isFlipped ? 1 : 0.5,
            pointerEvents: isFlipped ? 'auto' : 'none',
            transform: isFlipped ? 'translateY(0)' : 'translateY(10px)'
          }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleResponse('again')}
            className="h-auto py-2 flex flex-col gap-0.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive active:scale-95 transition-all"
          >
            <span className="flex items-center text-sm sm:text-base">
              <X className="mr-1 h-4 w-4" />
              Again
            </span>
            <span className="text-[10px] sm:text-xs opacity-70 font-normal">Didn&apos;t know</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleResponse('hard')}
            className="h-auto py-2 flex flex-col gap-0.5 border-amber-500/30 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/40 active:scale-95 transition-all"
          >
            <span className="text-sm sm:text-base">Hard</span>
            <span className="text-[10px] sm:text-xs opacity-70 font-normal">Barely knew</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleResponse('good')}
            className="h-auto py-2 flex flex-col gap-0.5 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/40 active:scale-95 transition-all"
          >
            <span className="text-sm sm:text-base">Good</span>
            <span className="text-[10px] sm:text-xs opacity-70 font-normal">Knew it</span>
          </Button>

          <Button
            size="lg"
            onClick={() => handleResponse('easy')}
            className="h-auto py-2 flex flex-col gap-0.5 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all shadow-sm"
          >
            <span className="flex items-center text-sm sm:text-base">
              <Check className="mr-1 h-4 w-4" />
              Easy
            </span>
            <span className="text-[10px] sm:text-xs opacity-80 font-normal">Too easy</span>
          </Button>
        </div>
      </footer>
    </div>
  )
}
