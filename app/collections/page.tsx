'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateCollectionDialog } from '@/components/create-collection-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { toast } from 'sonner'

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
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading collections...</p>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My Collections</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Group existing decks into collections
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    New Collection
                </Button>
            </div>

            {collections.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-base text-muted-foreground">
                        No collections yet. Create your first collection to organize your decks!
                    </p>
                </div>
            ) : (
                <div className="rounded-lg border bg-card">
                    <ul className="divide-y divide-border">
                        {collections.map((collection) => (
                            <li key={collection.id} className="p-4 transition-colors hover:bg-muted/30 sm:p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <Link
                                            href={`/collections/${collection.id}`}
                                            className="block font-medium leading-6 hover:underline line-clamp-1"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Folder className="h-4 w-4 text-blue-500" />
                                                {collection.name}
                                            </div>
                                        </Link>
                                        {collection.description && (
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                {collection.description}
                                            </p>
                                        )}
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {collection._count.decks} {collection._count.decks === 1 ? 'deck' : 'decks'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:justify-end">
                                        <Button asChild size="sm" className="min-w-[76px]">
                                            <Link href={`/collections/${collection.id}`}>View</Link>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="icon-sm"
                                            onClick={() => handleDelete(collection)}
                                            aria-label={`Delete ${collection.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
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
