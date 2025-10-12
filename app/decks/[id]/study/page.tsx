'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Flashcard } from '@/components/flashcard'

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

export default function StudyModePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [deck, setDeck] = useState<Deck | null>(null)
  const [shuffledCards, setShuffledCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchDeck = async () => {
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
      setShuffledCards(shuffleArray(data.cards))
    } catch (error) {
      console.error('Error fetching deck:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeck()
  }, [id])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : shuffledCards.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < shuffledCards.length - 1 ? prev + 1 : 0))
  }

  const handleShuffle = () => {
    if (deck) {
      setShuffledCards(shuffleArray(deck.cards))
      setCurrentIndex(0)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading deck...</p>
      </div>
    )
  }

  if (!deck || shuffledCards.length === 0) {
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

  const currentCard = shuffledCards[currentIndex]

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" asChild>
            <Link href={`/decks/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Deck
            </Link>
          </Button>

          <div className="text-center">
            <h1 className="text-2xl font-bold">{deck.name}</h1>
            <p className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {shuffledCards.length}
            </p>
          </div>

          <Button variant="outline" onClick={handleShuffle}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Shuffle
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 pb-16">
        <div className="w-full max-w-2xl">
          <Flashcard front={currentCard.front} back={currentCard.back} />
        </div>
      </div>

      <div className="container mx-auto p-8">
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            className="w-32"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Previous
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
            className="w-32"
          >
            Next
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
