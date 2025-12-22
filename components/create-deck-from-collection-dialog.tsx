'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/stores/app-store'

interface CreateDeckFromCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  collectionId: string
}

export function CreateDeckFromCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
  collectionId
}: CreateDeckFromCollectionDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const addDeck = useAppStore((state) => state.addDeck)
  const incrementCollectionDeckCount = useAppStore((state) => state.incrementCollectionDeckCount)

  const resetForm = () => {
    setName('')
    setDescription('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/collections/${collectionId}/create-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create deck')
      }

      const newDeck = await response.json()

      // Add to decks store and increment collection count
      useAppStore.setState((state) => ({
        decks: [{ ...newDeck, _count: { cards: 0 } }, ...state.decks],
        decksLoaded: true,
      }))
      incrementCollectionDeckCount(collectionId)

      toast.success('Deck created and added to collection')
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error('Error creating deck:', error)
      toast.error(error.message || 'Failed to create deck')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Deck</DialogTitle>
            <DialogDescription>
              Create a new flashcard deck and add it to this collection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter deck name"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter deck description"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating deck...' : 'Create & Add Deck'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
