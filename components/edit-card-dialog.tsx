'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

interface EditCardDialogProps {
  card: {
    id: string
    front: string
    back: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onDelete?: (card: { id: string; front: string; back: string }) => void
}

const MAX_CHAR_LIMIT = 200

export function EditCardDialog({ card, open, onOpenChange, onSuccess, onDelete }: EditCardDialogProps) {
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
              <div className="flex justify-between items-center">
                <Label htmlFor="edit-front">Front</Label>
                <span className={`text-xs ${front.length > MAX_CHAR_LIMIT ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {front.length}/{MAX_CHAR_LIMIT}
                </span>
              </div>
              <Textarea
                id="edit-front"
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
                <Label htmlFor="edit-back">Back</Label>
                <span className={`text-xs ${back.length > MAX_CHAR_LIMIT ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {back.length}/{MAX_CHAR_LIMIT}
                </span>
              </div>
              <Textarea
                id="edit-back"
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
          <DialogFooter className="flex-col gap-3 sm:flex-row sm:gap-2">
            {onDelete && card && (
              <div className="w-full sm:flex-1 sm:justify-start order-last sm:order-first">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    onOpenChange(false)
                    onDelete(card)
                  }}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
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
                className="flex-1 sm:flex-none"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
