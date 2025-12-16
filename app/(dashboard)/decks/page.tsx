'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Play, Trash2, Library } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateDeckDialog } from '@/components/create-deck-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
      toast.error('Failed to fetch decks')
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
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex h-48 flex-col justify-between rounded-xl border p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex items-center justify-between pt-4">
                <Skeleton className="h-4 w-16" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Decks</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your flashcard collections and study progress
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="shrink-0 shadow-sm">
          <Plus className="mr-2 h-5 w-5" />
          New Deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center animate-in fade-in-50">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
            <Library className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No decks created yet</h3>
          <p className="mt-2 text-muted-foreground max-w-sm mx-auto mb-8">
            Create your first deck to start adding flashcards and mastering new topics.
          </p>

        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-muted-foreground/20"
            >
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/decks/${deck.id}`}
                    className="font-semibold text-xl leading-tight hover:underline decoration-2 underline-offset-4 line-clamp-1"
                  >
                    {deck.name}
                  </Link>
                </div>

                <p className={cn(
                  "mt-3 text-sm text-muted-foreground line-clamp-3",
                  !deck.description && "italic opacity-50"
                )}>
                  {deck.description || "No description provided."}
                </p>
              </div>

              <div className="mt-auto border-t bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm font-medium text-muted-foreground">
                    <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-background border px-2 shadow-sm text-xs">
                      {deck._count.cards}
                    </span>
                    <span className="ml-2">{deck._count.cards === 1 ? 'card' : 'cards'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(deck)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${deck.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="h-4 w-px bg-border mx-1" />

                    <Button asChild variant="outline" size="sm" className="h-8 shadow-none">
                      <Link href={`/decks/${deck.id}`}>View</Link>
                    </Button>

                    {deck._count.cards > 0 && (
                      <Button asChild size="sm" className="h-8 gap-1.5 px-3">
                        <Link href={`/decks/${deck.id}/study`}>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Study
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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

