'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Save } from 'lucide-react'
import { toast } from 'sonner'

interface CreateCardDialogProps {
  deckId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const MAX_CHAR_LIMIT = 200

export function CreateCardDialog({ deckId, open, onOpenChange, onSuccess }: CreateCardDialogProps) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent, addAnother: boolean = false) => {
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
      toast.success('Card created')
      onSuccess()

      if (!addAnother) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error creating card:', error)
      toast.error('Failed to create card')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] gap-6">
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create New Card</DialogTitle>
            <DialogDescription className="text-base">
              Add a new flashcard to this deck.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="front" className="text-base font-semibold">Front</Label>
                <span className={`text-xs ${front.length > MAX_CHAR_LIMIT ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {front.length}/{MAX_CHAR_LIMIT}
                </span>
              </div>
              <Textarea
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter the question, term, or prompt"
                rows={4}
                maxLength={MAX_CHAR_LIMIT}
                required
                className={`resize-y min-h-[120px] text-base p-4 rounded-xl border-2 focus-visible:ring-0 focus-visible:border-primary transition-colors ${front.length > MAX_CHAR_LIMIT ? 'border-destructive' : 'border-muted'}`}
                autoFocus
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="back" className="text-base font-semibold">Back</Label>
                <span className={`text-xs ${back.length > MAX_CHAR_LIMIT ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {back.length}/{MAX_CHAR_LIMIT}
                </span>
              </div>
              <Textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Enter the answer or definition"
                rows={4}
                maxLength={MAX_CHAR_LIMIT}
                required
                className={`resize-y min-h-[120px] text-base p-4 rounded-xl border-2 focus-visible:ring-0 focus-visible:border-primary transition-colors ${back.length > MAX_CHAR_LIMIT ? 'border-destructive' : 'border-muted'}`}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || !front.trim() || !back.trim() || front.length > MAX_CHAR_LIMIT || back.length > MAX_CHAR_LIMIT}
              onClick={() => {
                if (!front.trim() || !back.trim()) return;
                handleSubmit({ preventDefault: () => { } } as React.FormEvent, true);
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Save & Add Another
            </Button>
            <Button
              type="submit"
              disabled={loading || !front.trim() || !back.trim() || front.length > MAX_CHAR_LIMIT || back.length > MAX_CHAR_LIMIT}
              className="w-full sm:w-auto shadow-md"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
