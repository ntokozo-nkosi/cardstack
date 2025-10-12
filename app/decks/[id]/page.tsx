'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreateCardDialog } from '@/components/create-card-dialog'
import { EditCardDialog } from '@/components/edit-card-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'

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
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

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
    } catch (error) {
      console.error('Error fetching deck:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeck()
  }, [id])

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

      await fetchDeck()
      setDeleteDialogOpen(false)
      setSelectedCard(null)
    } catch (error) {
      console.error('Error deleting card:', error)
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
    <div className="container mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Decks
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{deck.name}</h1>
            {deck.description && (
              <p className="text-muted-foreground">{deck.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {deck.cards.length} {deck.cards.length === 1 ? 'card' : 'cards'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {deck.cards.length > 0 && (
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/decks/${id}/study`}>
                  <Play className="mr-2 h-4 w-4" />
                  Study
                </Link>
              </Button>
            )}
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>
        </div>
      </div>

      {deck.cards.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground mb-4">
            No cards yet. Add your first card to get started!
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Card
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {deck.cards.map((card) => (
            <Card key={card.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 w-full">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Front
                      </p>
                      <p className="whitespace-pre-wrap">{card.front}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Back
                      </p>
                      <p className="whitespace-pre-wrap">{card.back}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(card)}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(card)}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Card"
        description="Are you sure you want to delete this card? This action cannot be undone."
      />
    </div>
  )
}
