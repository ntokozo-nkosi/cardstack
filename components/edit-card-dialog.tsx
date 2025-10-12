'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface EditCardDialogProps {
  card: {
    id: string
    front: string
    back: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditCardDialog({ card, open, onOpenChange, onSuccess }: EditCardDialogProps) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (card) {
      setFront(card.front)
      setBack(card.back)
    }
  }, [card])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!card) return

    setLoading(true)

    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front, back })
      })

      if (!response.ok) {
        throw new Error('Failed to update card')
      }

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error updating card:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription>
              Update the front and back of this flashcard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-front">Front</Label>
              <Textarea
                id="edit-front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter the question or prompt"
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-back">Back</Label>
              <Textarea
                id="edit-back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Enter the answer"
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !front.trim() || !back.trim()}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
