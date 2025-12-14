'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface CreateCardDialogProps {
  deckId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const MAX_CHAR_LIMIT = 180

export function CreateCardDialog({ deckId, open, onOpenChange, onSuccess }: CreateCardDialogProps) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front, back })
      })

      if (!response.ok) {
        throw new Error('Failed to create card')
      }

      setFront('')
      setBack('')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error creating card:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Card</DialogTitle>
            <DialogDescription>
              Add a new flashcard to this deck.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="front">Front</Label>
                <span className={`text-xs ${front.length > MAX_CHAR_LIMIT ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {front.length}/{MAX_CHAR_LIMIT}
                </span>
              </div>
              <Textarea
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter the question or prompt"
                rows={3}
                maxLength={MAX_CHAR_LIMIT}
                required
                className={front.length > MAX_CHAR_LIMIT ? 'border-destructive' : ''}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="back">Back</Label>
                <span className={`text-xs ${back.length > MAX_CHAR_LIMIT ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {back.length}/{MAX_CHAR_LIMIT}
                </span>
              </div>
              <Textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Enter the answer"
                rows={3}
                maxLength={MAX_CHAR_LIMIT}
                required
                className={back.length > MAX_CHAR_LIMIT ? 'border-destructive' : ''}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !front.trim() || !back.trim() || front.length > MAX_CHAR_LIMIT || back.length > MAX_CHAR_LIMIT}>
              {loading ? 'Creating...' : 'Create Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
