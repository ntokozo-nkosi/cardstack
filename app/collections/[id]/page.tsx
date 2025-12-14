'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddDeckToCollectionDialog } from '@/components/add-deck-to-collection-dialog'
import { toast } from 'sonner'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'

interface Deck {
    id: string
    name: string
    description: string | null
    _count: {
        cards: number
    }
}

interface Collection {
    id: string
    name: string
    description: string | null
    createdAt: string
    decks: Deck[]
}

export default function CollectionDetailsPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const [collection, setCollection] = useState<Collection | null>(null)
    const [loading, setLoading] = useState(true)
    const [addDeckDialogOpen, setAddDeckDialogOpen] = useState(false)
    const [deleteDeckDialogOpen, setDeleteDeckDialogOpen] = useState(false)
    const [selectedDeckToRemove, setSelectedDeckToRemove] = useState<Deck | null>(null)

    const fetchCollection = async () => {
        try {
            const response = await fetch(`/api/collections/${params.id}`)
            if (!response.ok) {
                if (response.status === 404) {
                    router.push('/collections')
                    return
                }
                throw new Error('Failed to fetch collection')
            }
            const data = await response.json()
            setCollection(data)
        } catch (error) {
            console.error('Error fetching collection:', error)
            toast.error('Failed to fetch collection')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (params.id) {
            fetchCollection()
        }
    }, [params.id, router])

    const handleRemoveDeck = (deck: Deck) => {
        setSelectedDeckToRemove(deck)
        setDeleteDeckDialogOpen(true)
    }

    const confirmRemoveDeck = async () => {
        if (!selectedDeckToRemove || !collection) return

        try {
            const response = await fetch(`/api/collections/${collection.id}/decks`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deckId: selectedDeckToRemove.id })
            })

            if (!response.ok) throw new Error('Failed to remove deck')

            toast.success('Deck removed from collection')
            await fetchCollection()
            setDeleteDeckDialogOpen(false)
            setSelectedDeckToRemove(null)
        } catch (error) {
            console.error('Error removing deck:', error)
            toast.error('Failed to remove deck')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading collection...</p>
            </div>
        )
    }

    if (!collection) return null

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
            <div className="mb-6">
                <Link href="/collections" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Collections
                </Link>
            </div>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{collection.name}</h1>
                    {collection.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {collection.description}
                        </p>
                    )}
                </div>
                <Button onClick={() => setAddDeckDialogOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Deck
                </Button>
            </div>

            {collection.decks.length === 0 ? (
                <div className="text-center py-16 border rounded-lg bg-muted/10 border-dashed">
                    <p className="text-base text-muted-foreground mb-4">
                        No decks in this collection yet.
                    </p>
                    <Button variant="outline" onClick={() => setAddDeckDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Deck
                    </Button>
                </div>
            ) : (
                <div className="rounded-lg border bg-card">
                    <ul className="divide-y divide-border">
                        {collection.decks.map((deck) => (
                            <li key={deck.id} className="p-4 transition-colors hover:bg-muted/30 sm:p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <Link
                                            href={`/decks/${deck.id}`}
                                            className="block font-medium leading-6 hover:underline line-clamp-1"
                                        >
                                            {deck.name}
                                        </Link>
                                        {deck.description && (
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                {deck.description}
                                            </p>
                                        )}
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {deck._count.cards} {deck._count.cards === 1 ? 'card' : 'cards'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:justify-end">
                                        <Button asChild size="sm" className="min-w-[76px]">
                                            <Link href={`/decks/${deck.id}`}>View</Link>
                                        </Button>

                                        {deck._count.cards > 0 && (
                                            <Button asChild variant="secondary" size="icon-sm" aria-label={`Study ${deck.name}`}>
                                                <Link href={`/decks/${deck.id}/study`} aria-label={`Study ${deck.name}`}>
                                                    <Play className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => handleRemoveDeck(deck)}
                                            aria-label={`Remove ${deck.name} from collection`}
                                            className="text-muted-foreground hover:text-destructive"
                                            title="Remove from collection"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <AddDeckToCollectionDialog
                open={addDeckDialogOpen}
                onOpenChange={setAddDeckDialogOpen}
                collectionId={collection.id}
                onSuccess={fetchCollection}
            />

            <DeleteConfirmDialog
                open={deleteDeckDialogOpen}
                onOpenChange={setDeleteDeckDialogOpen}
                onConfirm={confirmRemoveDeck}
                title="Remove Deck from Collection"
                description={`Are you sure you want to remove "${selectedDeckToRemove?.name}" from this collection? The deck itself will NOT be deleted.`}
            />
        </div>
    )
}
