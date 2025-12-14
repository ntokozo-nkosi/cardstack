'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { CreateDeckDialog } from '@/components/create-deck-dialog'

interface Deck {
  id: string
  name: string
  description: string | null
  _count: {
    cards: number
  }
}

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const fetchDecks = async () => {
    try {
      const response = await fetch('/api/decks')
      if (!response.ok) throw new Error('Failed to fetch decks')
      const data = await response.json()
      setDecks(data)
    } catch (error) {
      console.error('Error fetching decks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDecks()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading decks...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">My Decks</h1>
          <p className="text-sm text-muted-foreground">
            Create and study flashcard decks
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="w-full sm:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          New Deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground mb-4">
            No decks yet. Create your first deck to get started!
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Deck
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <ul className="divide-y">
            {decks.map((deck) => (
              <li key={deck.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/decks/${deck.id}`}
                      className="block font-medium leading-6 hover:underline line-clamp-1"
                    >
                      {deck.name}
                    </Link>
                    {deck.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {deck.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {deck._count.cards} {deck._count.cards === 1 ? 'card' : 'cards'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:justify-end">
                    <Button asChild size="sm" className="min-w-[80px]">
                      <Link href={`/decks/${deck.id}`}>View</Link>
                    </Button>

                    {deck._count.cards > 0 && (
                      <Button asChild variant="secondary" size="sm" className="px-2">
                        <Link href={`/decks/${deck.id}/study`} aria-label={`Study ${deck.name}`}>
                          <Play className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CreateDeckDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchDecks}
      />
    </div>
  )
}

