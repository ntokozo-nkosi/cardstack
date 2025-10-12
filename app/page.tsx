'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeckCard } from '@/components/deck-card'
import { CreateDeckDialog } from '@/components/create-deck-dialog'
import { EditDeckDialog } from '@/components/edit-deck-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'

interface Deck {
  id: string
  name: string
  description: string | null
  _count: {
    cards: number
  }
}

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
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

  const handleEdit = (deck: Deck) => {
    setSelectedDeck(deck)
    setEditDialogOpen(true)
  }

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

      await fetchDecks()
      setDeleteDialogOpen(false)
      setSelectedDeck(null)
    } catch (error) {
      console.error('Error deleting deck:', error)
    }
  }

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
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">CardStack</h1>
          <p className="text-muted-foreground">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={() => handleEdit(deck)}
              onDelete={() => handleDelete(deck)}
            />
          ))}
        </div>
      )}

      <CreateDeckDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchDecks}
      />

      <EditDeckDialog
        deck={selectedDeck}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
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
