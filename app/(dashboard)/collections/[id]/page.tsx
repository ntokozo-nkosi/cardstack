'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Plus, ArrowLeft, Play, X, Pencil, Loader2, Library } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { AddDeckToCollectionDialog } from '@/components/add-deck-to-collection-dialog'
import { toast } from 'sonner'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { cn } from '@/lib/utils'

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
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState('')
    const [isSavingTitle, setIsSavingTitle] = useState(false)
    const titleInputRef = useRef<HTMLInputElement>(null)
    const [isEditingDescription, setIsEditingDescription] = useState(false)
    const [editedDescription, setEditedDescription] = useState('')
    const [isSavingDescription, setIsSavingDescription] = useState(false)
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null)

    const fetchCollection = useCallback(async () => {
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
    }, [params.id, router])

    useEffect(() => {
        if (params.id) {
            fetchCollection()
        }
    }, [params.id, fetchCollection])

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            const input = titleInputRef.current
            input.focus()
            const length = input.value.length
            input.setSelectionRange(length, length)
        }
    }, [isEditingTitle])

    useEffect(() => {
        if (isEditingDescription && descriptionTextareaRef.current) {
            const textarea = descriptionTextareaRef.current
            textarea.focus()
            const length = textarea.value.length
            textarea.setSelectionRange(length, length)
        }
    }, [isEditingDescription])

    const startEditingTitle = () => {
        if (collection) {
            setEditedTitle(collection.name)
            setIsEditingTitle(true)
        }
    }

    const cancelEditingTitle = () => {
        setEditedTitle(collection?.name || '')
        setIsEditingTitle(false)
    }

    const saveTitle = async () => {
        if (!editedTitle.trim()) {
            setEditedTitle(collection?.name || '')
            setIsEditingTitle(false)
            return
        }

        if (editedTitle.trim() === collection?.name) {
            setIsEditingTitle(false)
            return
        }

        setIsSavingTitle(true)
        try {
            const response = await fetch(`/api/collections/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editedTitle.trim(), description: collection?.description })
            })

            if (!response.ok) throw new Error('Failed to update collection name')

            toast.success('Collection name updated')
            await fetchCollection()
            setIsEditingTitle(false)
        } catch (error) {
            console.error('Error updating collection name:', error)
            toast.error('Failed to update collection name')
            setEditedTitle(collection?.name || '')
        } finally {
            setIsSavingTitle(false)
        }
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            saveTitle()
        } else if (e.key === 'Escape') {
            cancelEditingTitle()
        }
    }

    const startEditingDescription = () => {
        if (collection) {
            setEditedDescription(collection.description || '')
            setIsEditingDescription(true)
        }
    }

    const cancelEditingDescription = () => {
        setEditedDescription(collection?.description || '')
        setIsEditingDescription(false)
    }

    const saveDescription = async () => {
        const trimmedDescription = editedDescription.trim()
        
        if (trimmedDescription === (collection?.description || '')) {
            setIsEditingDescription(false)
            return
        }

        setIsSavingDescription(true)
        try {
            const response = await fetch(`/api/collections/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: collection?.name, 
                    description: trimmedDescription || null 
                })
            })

            if (!response.ok) throw new Error('Failed to update collection description')

            toast.success('Collection description updated')
            await fetchCollection()
            setIsEditingDescription(false)
        } catch (error) {
            console.error('Error updating collection description:', error)
            toast.error('Failed to update collection description')
            setEditedDescription(collection?.description || '')
        } finally {
            setIsSavingDescription(false)
        }
    }

    const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            saveDescription()
        } else if (e.key === 'Escape') {
            cancelEditingDescription()
        }
    }

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
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-4 w-full max-w-md">
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex h-48 flex-col justify-between rounded-xl border p-6">
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <div className="flex items-center justify-between pt-4">
                                <Skeleton className="h-4 w-16" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (!collection) return null

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link
                    href="/collections"
                    className="group inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Collections
                </Link>
            </div>

            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                    {isEditingTitle ? (
                        <div className="relative mb-2">
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                onBlur={saveTitle}
                                onKeyDown={handleTitleKeyDown}
                                disabled={isSavingTitle}
                                className="w-full border-0 border-b-2 border-primary bg-transparent px-0 py-1 text-3xl font-bold tracking-tight outline-none transition-colors focus:border-primary disabled:opacity-50 sm:text-4xl"
                            />
                            {isSavingTitle && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="group mb-2 flex cursor-pointer items-center gap-3" onClick={startEditingTitle}>
                            <h1 className="truncate text-3xl font-bold tracking-tight transition-colors group-hover:text-primary/90 sm:text-4xl">
                                {collection.name}
                            </h1>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    )}
                    {isEditingDescription ? (
                        <div className="relative">
                            <Textarea
                                ref={descriptionTextareaRef}
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                onBlur={saveDescription}
                                onKeyDown={handleDescriptionKeyDown}
                                disabled={isSavingDescription}
                                placeholder="Add a description..."
                                maxLength={100}
                                className="min-h-[50px] resize-none border-2 border-primary text-base"
                            />
                            {isSavingDescription && (
                                <div className="absolute right-2 top-2">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div 
                            className="group/desc cursor-pointer rounded-md px-2 py-1 -mx-2 hover:bg-muted/50 transition-colors"
                            onClick={startEditingDescription}
                        >
                            <div className="flex items-start gap-2">
                                <p className={collection.description ? "text-lg text-muted-foreground flex-1" : "text-lg text-muted-foreground flex-1 italic opacity-70"}>
                                    {collection.description || "No description"}
                                </p>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 opacity-0 transition-opacity group-hover/desc:opacity-100"
                                >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <Button onClick={() => setAddDeckDialogOpen(true)} size="lg" className="shrink-0 shadow-sm">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Deck
                </Button>
            </div>

            {collection.decks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center animate-in fade-in-50">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
                        <Library className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">No decks in this collection</h3>
                    <p className="mt-2 text-muted-foreground max-w-sm mx-auto mb-8">
                        Add existing decks to this collection to organize your study materials.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {collection.decks.map((deck) => (
                        <div
                            key={deck.id}
                            className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-muted-foreground/20"
                        >
                            <div className="flex flex-1 flex-col p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <Link
                                        href={`/decks/${deck.id}`}
                                        className="font-semibold text-xl leading-tight hover:underline decoration-2 underline-offset-4 line-clamp-1"
                                    >
                                        {deck.name}
                                    </Link>
                                </div>

                                <p className={cn(
                                    "mt-3 text-sm text-muted-foreground line-clamp-3",
                                    !deck.description && "italic opacity-50"
                                )}>
                                    {deck.description || "No description provided."}
                                </p>
                            </div>

                            <div className="mt-auto border-t bg-muted/20 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                                        <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-background border px-2 shadow-sm text-xs">
                                            {deck._count.cards}
                                        </span>
                                        <span className="ml-2">{deck._count.cards === 1 ? 'card' : 'cards'}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                            <Link href={`/decks/${deck.id}`}>View</Link>
                                        </Button>

                                        {deck._count.cards > 0 && (
                                            <Button asChild size="sm" className="h-8 gap-1.5 px-3">
                                                <Link href={`/decks/${deck.id}/study`}>
                                                    <Play className="h-3.5 w-3.5 fill-current" />
                                                    Study
                                                </Link>
                                            </Button>
                                        )}

                                        <div className="h-4 w-px bg-border mx-1" />

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveDeck(deck)}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            title="Remove from collection"
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove from collection</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddDeckToCollectionDialog
                open={addDeckDialogOpen}
                onOpenChange={setAddDeckDialogOpen}
                collectionId={collection.id}
                existingDeckIds={collection.decks.map(d => d.id)}
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
