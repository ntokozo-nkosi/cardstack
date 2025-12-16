'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Folder, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateCollectionDialog } from '@/components/create-collection-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Collection {
    id: string
    name: string
    description: string | null
    _count: {
        decks: number
    }
}

export default function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([])
    const [loading, setLoading] = useState(true)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)

    const fetchCollections = async () => {
        try {
            const response = await fetch('/api/collections')
            if (!response.ok) throw new Error('Failed to fetch collections')
            const data = await response.json()
            setCollections(data)
        } catch (error) {
            console.error('Error fetching collections:', error)
            toast.error('Failed to fetch collections')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCollections()
    }, [])

    const handleDelete = (collection: Collection) => {
        setSelectedCollection(collection)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!selectedCollection) return

        try {
            const response = await fetch(`/api/collections/${selectedCollection.id}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete collection')

            toast.success('Collection deleted')
            await fetchCollections()
            setDeleteDialogOpen(false)
            setSelectedCollection(null)
        } catch (error) {
            console.error('Error deleting collection:', error)
            toast.error('Failed to delete collection')
        }
    }

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex h-48 flex-col justify-between rounded-xl border p-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5 rounded-full" />
                                    <Skeleton className="h-6 w-3/4" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <div className="flex items-center justify-between pt-4">
                                <Skeleton className="h-4 w-20" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Collections</h1>
                    <p className="mt-2 text-muted-foreground">
                        Group existing decks into collections
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="shrink-0 shadow-sm">
                    <Plus className="mr-2 h-5 w-5" />
                    New Collection
                </Button>
            </div>

            {collections.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center animate-in fade-in-50">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
                        <Layers className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">No collections yet</h3>
                    <p className="mt-2 text-muted-foreground max-w-sm mx-auto mb-8">
                        Create collections to organize your decks by topic, semester, or category.
                    </p>
                    <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Collection
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-muted-foreground/20"
                        >
                            <div className="flex flex-1 flex-col p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <Link
                                        href={`/collections/${collection.id}`}
                                        className="group/link flex items-center gap-2 font-semibold text-xl leading-tight hover:underline decoration-2 underline-offset-4 line-clamp-1"
                                    >
                                        <Folder className="h-5 w-5 text-primary transition-colors group-hover/link:text-primary/90" />
                                        {collection.name}
                                    </Link>
                                </div>

                                <p className={cn(
                                    "mt-3 text-sm text-muted-foreground line-clamp-3",
                                    !collection.description && "italic opacity-50"
                                )}>
                                    {collection.description || "No description provided."}
                                </p>
                            </div>

                            <div className="mt-auto border-t bg-muted/20 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                                        <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-background border px-2 shadow-sm text-xs">
                                            {collection._count.decks}
                                        </span>
                                        <span className="ml-2">{collection._count.decks === 1 ? 'deck' : 'decks'}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(collection)}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            aria-label={`Delete ${collection.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        <div className="h-4 w-px bg-border mx-1" />

                                        <Button asChild variant="outline" size="sm" className="h-8 shadow-none">
                                            <Link href={`/collections/${collection.id}`}>View</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateCollectionDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={fetchCollections}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Delete Collection"
                description={`Are you sure you want to delete "${selectedCollection?.name}"? The decks within the collection will NOT be deleted.`}
            />
        </div>
    )
}
