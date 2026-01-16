'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit2, Trash2, Play, Pencil, Loader2, Library, FolderPlus, MoreHorizontal, Upload, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/stores/app-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { CreateCardDialog } from '@/components/create-card-dialog'
import { EditCardDialog } from '@/components/edit-card-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { AddToCollectionDialog } from '@/components/add-to-collection-dialog'
import { ImportCardsDialog } from '@/components/import-cards-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Card {
  id: string
  front: string
  back: string
  repetitions?: number
  dueDate?: string
  isNew?: boolean
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

  const decrementDeckCardCount = useAppStore((state) => state.decrementDeckCardCount)
  const deleteDeckFromStore = useAppStore((state) => state.deleteDeck)

  const [deck, setDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteDeckDialogOpen, setDeleteDeckDialogOpen] = useState(false)
  const [addToCollectionDialogOpen, setAddToCollectionDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchDeck = useCallback(async () => {
    try {
      const response = await fetch(`/api/decks/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/decks')
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
      const length = input.value.length
      input.setSelectionRange(length, length)
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (isEditingDescription && descriptionTextareaRef.current) {
      const textarea = descriptionTextareaRef.current
      textarea.focus()
      const length = textarea.value.length
      textarea.setSelectionRange(length, length)
    }
  }, [isEditingDescription])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const filteredCards = deck?.cards.filter(card => {
    const searchLower = debouncedSearchTerm.toLowerCase()
    return card.front.toLowerCase().includes(searchLower) ||
           card.back.toLowerCase().includes(searchLower)
  }) || []

  const stats = useMemo(() => {
    if (!deck?.cards) return { due: 0, new: 0, learning: 0, mature: 0 }

    const now = new Date()
    return deck.cards.reduce((acc, card) => {
      const isDue = !card.dueDate || new Date(card.dueDate) <= now
      const isNew = card.isNew ?? true
      const reps = card.repetitions ?? 0

      if (isNew) {
        acc.new++
      } else if (reps >= 3) {
        acc.mature++
      } else {
        acc.learning++
      }

      if (isDue) acc.due++

      return acc
    }, { due: 0, new: 0, learning: 0, mature: 0 })
  }, [deck?.cards])

  const getCardDueLabel = (card: Card) => {
    if (!card.dueDate) return { label: 'Due', isDue: true }

    const now = new Date()
    const dueDate = new Date(card.dueDate)

    if (dueDate <= now) return { label: 'Due', isDue: true }

    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return { label: 'Due tomorrow', isDue: false }
    return { label: `Due in ${diffDays} days`, isDue: false }
  }

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

  const startEditingDescription = () => {
    if (deck) {
      setEditedDescription(deck.description || '')
      setIsEditingDescription(true)
    }
  }

  const cancelEditingDescription = () => {
    setEditedDescription(deck?.description || '')
    setIsEditingDescription(false)
  }

  const saveDescription = async () => {
    const trimmedDescription = editedDescription.trim()
    
    if (trimmedDescription === (deck?.description || '')) {
      setIsEditingDescription(false)
      return
    }

    setIsSavingDescription(true)
    try {
      const response = await fetch(`/api/decks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: deck?.name, 
          description: trimmedDescription || null 
        })
      })

      if (!response.ok) throw new Error('Failed to update deck description')

      toast.success('Deck description updated')
      await fetchDeck()
      setIsEditingDescription(false)
    } catch (error) {
      console.error('Error updating deck description:', error)
      toast.error('Failed to update deck description')
      setEditedDescription(deck?.description || '')
    } finally {
      setIsSavingDescription(false)
    }
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveDescription()
    } else if (e.key === 'Escape') {
      cancelEditingDescription()
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

      decrementDeckCardCount(id)
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

    const success = await deleteDeckFromStore(deck.id)
    if (success) {
      toast.success('Deck deleted')
      router.push('/decks')
    } else {
      toast.error('Failed to delete deck')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl border p-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!deck) return null

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/decks"
        className="group mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Decks
      </Link>

      <div className="mb-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="relative mb-2">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={handleTitleKeyDown}
                  disabled={isSavingTitle}
                  className="w-full border-0 border-b-2 border-primary bg-transparent px-0 py-1 text-3xl font-bold tracking-tight outline-none transition-colors focus:border-primary disabled:opacity-50 sm:text-4xl"
                />
                {isSavingTitle && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            ) : (
              <div className="group mb-2 flex cursor-pointer items-center gap-3" onClick={startEditingTitle}>
                <h1 className="truncate text-3xl font-bold tracking-tight transition-colors group-hover:text-primary/90 sm:text-4xl">
                  {deck.name}
                </h1>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-1 text-muted-foreground">
              {isEditingDescription ? (
                <div className="relative">
                  <Textarea
                    ref={descriptionTextareaRef}
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    onBlur={saveDescription}
                    onKeyDown={handleDescriptionKeyDown}
                    disabled={isSavingDescription}
                    placeholder="Add a description..."
                    maxLength={100}
                    className="min-h-[50px] resize-none border-2 border-primary text-base"
                  />
                  {isSavingDescription && (
                    <div className="absolute right-2 top-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="group/desc cursor-pointer rounded-md px-2 py-1 -mx-2 hover:bg-muted/50 transition-colors"
                  onClick={startEditingDescription}
                >
                  <div className="flex items-start gap-2">
                    <p className={deck.description ? "text-lg flex-1" : "text-lg flex-1 italic opacity-70"}>
                      {deck.description || "No description"}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 transition-opacity group-hover/desc:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium mt-2">
                <div className="flex items-center text-muted-foreground">
                  <Library className="mr-2 h-4 w-4" />
                  {deck.cards.length} {deck.cards.length === 1 ? 'card' : 'cards'}
                </div>
                {deck.cards.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground/60">|</span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-primary/10 px-1.5 text-xs font-semibold text-primary">
                        {stats.due}
                      </span>
                      <span className="text-muted-foreground">due</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-blue-500/10 px-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {stats.new}
                      </span>
                      <span className="text-muted-foreground">new</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-orange-500/10 px-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                        {stats.learning}
                      </span>
                      <span className="text-muted-foreground">learning</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-green-500/10 px-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                        {stats.mature}
                      </span>
                      <span className="text-muted-foreground">mature</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {deck.cards.length > 0 && (
                <Button asChild size="lg" className="shadow-sm">
                  <Link href={`/decks/${id}/study`}>
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Study Deck
                  </Link>
                </Button>
              )}
              <Button onClick={() => setCreateDialogOpen(true)} size="lg" variant={deck.cards.length > 0 ? "secondary" : "default"}>
                <Plus className="mr-2 h-5 w-5" />
                Add Card
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAddToCollectionDialogOpen(true)}>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Add to Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Cards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteDeckDialogOpen(true)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Deck
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {deck.cards.length > 0 && (
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-border/50">
          <div className="flex-1 relative">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search flashcards (front or back)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && searchTerm) {
                  setSearchTerm('')
                }
              }}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {debouncedSearchTerm && (
            <div className="text-sm text-muted-foreground">
              {filteredCards.length} of {deck.cards.length} {deck.cards.length === 1 ? 'card' : 'cards'}
            </div>
          )}
        </div>
      )}

      {deck.cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center animate-in fade-in-50">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
            <Plus className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">This deck is empty</h3>
          <p className="mt-2 text-muted-foreground max-w-sm mx-auto mb-8">
            Add cards to this deck to start studying.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Create First Card
          </Button>
        </div>
      ) : debouncedSearchTerm && filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center animate-in fade-in-50">
          <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">No cards found</h3>
          <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
            No flashcards match &quot;{debouncedSearchTerm}&quot;. Try different keywords.
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchTerm('')}
            className="mt-6"
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-muted-foreground/30 cursor-pointer"
              onClick={() => handleEdit(card)}
            >
              <div className="mb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Front</h4>
                  {(() => {
                    const { label, isDue } = getCardDueLabel(card)
                    return (
                      <span className={cn(
                        "text-xs",
                        isDue ? "text-primary font-medium" : "text-muted-foreground/60"
                      )}>
                        {label}
                      </span>
                    )
                  })()}
                </div>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{card.front}</p>
              </div>

              <div className="flex items-end justify-between pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground italic truncate max-w-[70%] opacity-0 transition-opacity group-hover:opacity-100">
                  Click to edit details
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(card)
                    }}
                    aria-label="Delete card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(card)
                    }}
                    aria-label="Edit card"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
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
        card={selectedCard ? { ...selectedCard, deckId: id } : null}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchDeck}
      />

      <AddToCollectionDialog
        open={addToCollectionDialogOpen}
        onOpenChange={setAddToCollectionDialogOpen}
        deckId={id}
        onSuccess={() => toast.success('Added to collection')}
      />

      <ImportCardsDialog
        deckId={id}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchDeck}
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
