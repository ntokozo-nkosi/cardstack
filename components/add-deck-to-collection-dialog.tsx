'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useDecks } from '@/hooks/use-decks'
import { useAppStore } from '@/lib/stores/app-store'

interface AddDeckToCollectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    collectionId: string
    existingDeckIds: string[]
    onSuccess: () => void
}

export function AddDeckToCollectionDialog({
    open,
    onOpenChange,
    collectionId,
    existingDeckIds,
    onSuccess
}: AddDeckToCollectionDialogProps) {
    const { decks, isLoading: fetchingDecks } = useDecks()
    const incrementCollectionDeckCount = useAppStore((state) => state.incrementCollectionDeckCount)
    const [selectedDeckId, setSelectedDeckId] = useState('')
    const [loading, setLoading] = useState(false)

    const availableDecks = decks.filter((deck) => !existingDeckIds.includes(deck.id))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDeckId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/collections/${collectionId}/decks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deckId: selectedDeckId })
            })

            if (!response.ok) {
                throw new Error('Failed to add deck to collection')
            }

            incrementCollectionDeckCount(collectionId)
            setSelectedDeckId('')
            toast.success('Deck added to collection')
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            console.error('Error adding deck to collection:', error)
            toast.error('Failed to add deck to collection')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Deck to Collection</DialogTitle>
                        <DialogDescription>
                            Select an existing deck to add to this collection.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="deck-select">Select Deck</Label>
                            <select
                                id="deck-select"
                                value={selectedDeckId}
                                onChange={(e) => setSelectedDeckId(e.target.value)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="" disabled>
                                    {fetchingDecks ? "Loading decks..." : "Select a deck"}
                                </option>
                                {availableDecks.map((deck) => (
                                    <option key={deck.id} value={deck.id}>
                                        {deck.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !selectedDeckId}>
                            {loading ? 'Adding...' : 'Add Deck'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
