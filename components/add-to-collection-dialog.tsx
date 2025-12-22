'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useCollections } from '@/hooks/use-collections'
import { useAppStore } from '@/lib/stores/app-store'

interface AddToCollectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    deckId: string
    onSuccess?: () => void
}

export function AddToCollectionDialog({
    open,
    onOpenChange,
    deckId,
    onSuccess
}: AddToCollectionDialogProps) {
    const { collections, isLoading: fetchingCollections } = useCollections()
    const incrementCollectionDeckCount = useAppStore((state) => state.incrementCollectionDeckCount)
    const [selectedCollectionId, setSelectedCollectionId] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCollectionId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/collections/${selectedCollectionId}/decks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deckId })
            })

            if (!response.ok) {
                throw new Error('Failed to add deck to collection')
            }

            incrementCollectionDeckCount(selectedCollectionId)
            setSelectedCollectionId('')
            toast.success('Deck added to collection')
            onOpenChange(false)
            onSuccess?.()
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
                        <DialogTitle>Add to Collection</DialogTitle>
                        <DialogDescription>
                            Select a collection to add this deck to.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="collection-select">Select Collection</Label>
                            <select
                                id="collection-select"
                                value={selectedCollectionId}
                                onChange={(e) => setSelectedCollectionId(e.target.value)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="" disabled>
                                    {fetchingCollections ? "Loading collections..." : "Select a collection"}
                                </option>
                                {collections.map((collection) => (
                                    <option key={collection.id} value={collection.id}>
                                        {collection.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !selectedCollectionId}>
                            {loading ? 'Adding...' : 'Add to Collection'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
