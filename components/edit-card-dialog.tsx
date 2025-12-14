'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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

      toast.success('Card updated')
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
          <DialogFooter className="flex flex-row gap-2 justify-end sm:justify-between items-center mt-4">
            {onDelete && card && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => {
                  onOpenChange(false)
                  onDelete(card)
                }}
                disabled={loading}
                title="Delete Card"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <div className="flex gap-2 flex-1 sm:flex-none sm:ml-auto w-full sm:w-auto">
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
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
