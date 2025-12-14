'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Play, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreateCardDialog } from '@/components/create-card-dialog'
import { EditCardDialog } from '@/components/edit-card-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { AddToCollectionDialog } from '@/components/add-to-collection-dialog'
import { toast } from 'sonner'

interface Card {
  id: string
  front: string
  back: string
}

interface Deck {
  id: string
  name: string
  description: string | null
  cards: Card[]
}

export default function DeckDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [deck, setDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteDeckDialogOpen, setDeleteDeckDialogOpen] = useState(false)
  const [addToCollectionDialogOpen, setAddToCollectionDialogOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

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
    } catch (error) {
      console.error('Error fetching deck:', error)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchDeck()
  }, [fetchDeck])

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      const input = titleInputRef.current
      input.focus()
      // Place cursor at the end instead of selecting all
      const length = input.value.length
      input.setSelectionRange(length, length)
    }
  }, [isEditingTitle])

  const startEditingTitle = () => {
    if (deck) {
      setEditedTitle(deck.name)
      setIsEditingTitle(true)
    }
  }

  const cancelEditingTitle = () => {
    setEditedTitle(deck?.name || '')
    setIsEditingTitle(false)
  }

  const saveTitle = async () => {
    if (!editedTitle.trim()) {
      setEditedTitle(deck?.name || '')
      setIsEditingTitle(false)
      return
    }

    if (editedTitle.trim() === deck?.name) {
      setIsEditingTitle(false)
      return
    }

    setIsSavingTitle(true)
    try {
      const response = await fetch(`/api/decks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editedTitle.trim(), description: deck?.description })
      })

      if (!response.ok) throw new Error('Failed to update deck name')

      toast.success('Deck name updated')
      await fetchDeck()
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Error updating deck name:', error)
      toast.error('Failed to update deck name')
      setEditedTitle(deck?.name || '')
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveTitle()
    } else if (e.key === 'Escape') {
      cancelEditingTitle()
    }
  }

  const handleEdit = (card: Card) => {
    setSelectedCard(card)
    setEditDialogOpen(true)
  }

  const handleDelete = (card: Card) => {
    setSelectedCard(card)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCard) return

    try {
      const response = await fetch(`/api/cards/${selectedCard.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete card')

      toast.success('Card deleted')
      await fetchDeck()
      setDeleteDialogOpen(false)
      setSelectedCard(null)
    } catch (error) {
      console.error('Error deleting card:', error)
      toast.error('Failed to delete card')
    }
  }

  const confirmDeleteDeck = async () => {
    if (!deck) return

    try {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete deck')

      toast.success('Deck deleted')
      router.push('/')
    } catch (error) {
      console.error('Error deleting deck:', error)
      toast.error('Failed to delete deck')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading deck...</p>
      </div>
    )
  }

  if (!deck) return null

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 -ml-2 pl-2 pr-3 rounded-md hover:bg-muted/50"
      >
        <ArrowLeft size={16} />
        Back to Decks
      </Link>

      <div className="mb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="relative mb-1">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={handleTitleKeyDown}
                  disabled={isSavingTitle}
                  className="w-full border-0 border-b-2 border-primary bg-transparent px-0 py-0 text-3xl font-semibold tracking-tight outline-none transition-colors focus:border-primary disabled:opacity-50"
                />
                {isSavingTitle && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            ) : (
              <div className="group mb-1 flex cursor-pointer items-center gap-3" onClick={startEditingTitle}>
                <h1 className="truncate text-3xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                  {deck.name}
                </h1>
                <Pencil className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary sm:h-5 sm:w-5" />
              </div>
            )}

            {deck.description && (
              <p className="mt-2 text-sm text-muted-foreground">{deck.description}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {deck.cards.length} {deck.cards.length === 1 ? 'card' : 'cards'}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="inline-flex items-center justify-center gap-2"
                onClick={() => setAddToCollectionDialogOpen(true)}
              >
                <Plus size={16} />
                Add to Collection
              </Button>
              <button
                onClick={() => setDeleteDeckDialogOpen(true)}
                className="inline-flex items-center justify-center gap-2 self-start px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors sm:self-auto"
                aria-label="Delete deck"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {deck.cards.length > 0 && (
                <Button asChild className="w-full sm:w-auto h-11 sm:h-9">
                  <Link href={`/decks/${id}/study`}>
                    <Play className="mr-2 h-4 w-4" />
                    Study
                  </Link>
                </Button>
              )}
              <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto h-11 sm:h-9">
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </div>
          </div>
        </div>
      </div>

      {deck.cards.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-base text-muted-foreground">
            No cards yet. Add your first card to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {deck.cards.map((card) => (
            <Card key={card.id} className="py-0 hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer" onClick={() => handleEdit(card)}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <p className="whitespace-pre-wrap text-sm sm:text-sm leading-relaxed flex-1 min-w-0 py-1">{card.front}</p>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 sm:h-8 sm:w-8 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(card)
                    }}
                    aria-label="Edit card"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateCardDialog
        deckId={id}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchDeck}
      />

      <EditCardDialog
        card={selectedCard}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchDeck}
        onDelete={handleDelete}
      />

      <AddToCollectionDialog
        open={addToCollectionDialogOpen}
        onOpenChange={setAddToCollectionDialogOpen}
        deckId={id}
        onSuccess={() => toast.success('Added to collection')}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Card"
        description="Are you sure you want to delete this card? This action cannot be undone."
      />

      <DeleteConfirmDialog
        open={deleteDeckDialogOpen}
        onOpenChange={setDeleteDeckDialogOpen}
        onConfirm={confirmDeleteDeck}
        title="Delete Deck"
        description={`Are you sure you want to delete "${deck?.name}"? This will also delete all cards in this deck. This action cannot be undone.`}
      />
    </div>
  )
}
