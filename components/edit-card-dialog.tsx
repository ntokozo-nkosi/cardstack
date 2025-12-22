'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDecks } from '@/hooks/use-decks'

interface EditCardDialogProps {
  card: {
    id: string
    front: string
    back: string
    deckId?: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const MAX_CHAR_LIMIT = 200

export function EditCardDialog({ card, open, onOpenChange, onSuccess }: EditCardDialogProps) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDeckId, setSelectedDeckId] = useState('')
  const [currentDeckId, setCurrentDeckId] = useState('')
  const { decks, isLoading: loadingDecks } = useDecks()

  useEffect(() => {
    if (open && card) {
      setFront(card.front)
      setBack(card.back)
      setCurrentDeckId(card.deckId || '')
      setSelectedDeckId(card.deckId || '')
    }
  }, [open, card])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!card) return

    setLoading(true)

    try {
      const payload: { front: string; back: string; deckId?: string } = {
        front,
        back
      }

      // Only include deckId if it changed
      if (selectedDeckId && selectedDeckId !== currentDeckId) {
        payload.deckId = selectedDeckId
      }

      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to update card')
      }

      const message = payload.deckId ? 'Card updated and moved' : 'Card updated'
      toast.success(message)
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error updating card:', error)
      toast.error('Failed to update card')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] gap-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Card</DialogTitle>
            <DialogDescription className="text-base">
              Update the front and back of this flashcard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-2 pt-2">
              <Label htmlFor="deck-select" className="text-base font-semibold">
                Deck
              </Label>
              {loadingDecks ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading decks...</span>
                </div>
              ) : decks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No decks available</p>
              ) : (
                <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select a deck" />
                  </SelectTrigger>
                  <SelectContent>
                    {decks.map((deck) => (
                      <SelectItem key={deck.id} value={deck.id}>
                        {deck.name}
                        {deck.id === currentDeckId && " (current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="edit-front" className="text-base font-semibold">Front</Label>
                <span className={`text-xs ${front.length > MAX_CHAR_LIMIT ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {front.length}/{MAX_CHAR_LIMIT}
                </span>
              </div>
              <Textarea
                id="edit-front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter the question or prompt"
                rows={4}
                maxLength={MAX_CHAR_LIMIT}
                required
                className={`resize-y min-h-[120px] text-base p-4 rounded-xl border-2 focus-visible:ring-0 focus-visible:border-primary transition-colors ${front.length > MAX_CHAR_LIMIT ? 'border-destructive' : 'border-muted'}`}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="edit-back" className="text-base font-semibold">Back</Label>
                <span className={`text-xs ${back.length > MAX_CHAR_LIMIT ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {back.length}/{MAX_CHAR_LIMIT}
                </span>
              </div>
              <Textarea
                id="edit-back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Enter the answer"
                rows={4}
                maxLength={MAX_CHAR_LIMIT}
                required
                className={`resize-y min-h-[120px] text-base p-4 rounded-xl border-2 focus-visible:ring-0 focus-visible:border-primary transition-colors ${back.length > MAX_CHAR_LIMIT ? 'border-destructive' : 'border-muted'}`}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !front.trim() || !back.trim() || front.length > MAX_CHAR_LIMIT || back.length > MAX_CHAR_LIMIT}
              className="flex-1 sm:flex-none shadow-md"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
