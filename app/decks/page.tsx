'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Play, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateDeckDialog } from '@/components/create-deck-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { toast } from 'sonner'

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)

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

  const handleDelete = (deck: Deck) => {
    setSelectedDeck(deck)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedDeck) return

    try {
      const response = await fetch(`/api/decks/${selectedDeck.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete deck')

      toast.success('Deck deleted')
      await fetchDecks()
      setDeleteDialogOpen(false)
      setSelectedDeck(null)
    } catch (error) {
      console.error('Error deleting deck:', error)
      toast.error('Failed to delete deck')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My Decks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and study flashcard decks
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-base text-muted-foreground mb-4">
            No decks yet. Create your first deck to get started!
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Deck
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <ul className="divide-y divide-border">
            {decks.map((deck) => (
              <li key={deck.id} className="p-4 transition-colors hover:bg-muted/30 sm:p-5">
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
                    <Button asChild size="sm" className="min-w-[76px]">
                      <Link href={`/decks/${deck.id}`}>View</Link>
                    </Button>

                    {deck._count.cards > 0 && (
                      <Button asChild variant="secondary" size="icon-sm" aria-label={`Study ${deck.name}`}>
                        <Link href={`/decks/${deck.id}/study`} aria-label={`Study ${deck.name}`}>
                          <Play className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleDelete(deck)}
                      aria-label={`Delete ${deck.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Deck"
        description={`Are you sure you want to delete "${selectedDeck?.name}"? This will also delete all cards in this deck. This action cannot be undone.`}
      />
    </div>
  )
}

