'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'

interface CreateDeckFromCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  collectionId: string
}

type CreationStep = 'idle' | 'creating-deck' | 'associating' | 'error-associating'

export function CreateDeckFromCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
  collectionId
}: CreateDeckFromCollectionDialogProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creationStep, setCreationStep] = useState<CreationStep>('idle')
  const [createdDeckId, setCreatedDeckId] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setDescription('')
    setCreationStep('idle')
    setCreatedDeckId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Step 1: Create the deck
    setCreationStep('creating-deck')
    try {
      const createResponse = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create deck')
      }

      const newDeck = await createResponse.json()
      setCreatedDeckId(newDeck.id)

      // Step 2: Associate deck with collection
      setCreationStep('associating')
      const associateResponse = await fetch(`/api/collections/${collectionId}/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId: newDeck.id })
      })

      if (!associateResponse.ok) {
        // Deck was created but association failed
        setCreationStep('error-associating')
        toast.error('Deck created but failed to add to collection')
        return
      }

      // Success!
      toast.success('Deck created and added to collection')
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error creating deck:', error)
      if (creationStep === 'creating-deck') {
        toast.error('Failed to create deck')
        setCreationStep('idle')
      }
    }
  }

  const handleRetryAssociation = async () => {
    if (!createdDeckId) return

    setCreationStep('associating')
    try {
      const response = await fetch(`/api/collections/${collectionId}/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId: createdDeckId })
      })

      if (!response.ok) {
        throw new Error('Failed to associate deck')
      }

      toast.success('Deck added to collection')
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error associating deck:', error)
      toast.error('Failed to add deck to collection')
      setCreationStep('error-associating')
    }
  }

  const handleGoToDeck = () => {
    if (!createdDeckId) return
    resetForm()
    onOpenChange(false)
    router.push(`/decks/${createdDeckId}`)
  }

  const handleCancel = () => {
    if (creationStep === 'error-associating') {
      // Deck was created but not associated - ask for confirmation
      if (confirm('The deck was created but not added to the collection. Are you sure you want to close this dialog?')) {
        resetForm()
        onOpenChange(false)
      }
    } else {
      resetForm()
      onOpenChange(false)
    }
  }

  const isLoading = creationStep === 'creating-deck' || creationStep === 'associating'

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

          {creationStep === 'error-associating' && (
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">
                    Deck Created
                  </h4>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-500">
                    The deck was created successfully, but we couldn't add it to this collection. You can retry or visit the deck directly.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRetryAssociation}
                      disabled={isLoading}
                    >
                      Retry
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGoToDeck}
                    >
                      Go to Deck
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter deck name"
                required
                disabled={isLoading || creationStep === 'error-associating'}
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
                disabled={isLoading || creationStep === 'error-associating'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {creationStep !== 'error-associating' && (
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {creationStep === 'creating-deck' && 'Creating deck...'}
                {creationStep === 'associating' && 'Adding to collection...'}
                {creationStep === 'idle' && 'Create & Add Deck'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
