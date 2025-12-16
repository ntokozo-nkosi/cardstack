"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EditCardDialog } from '@/components/edit-card-dialog';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { CreateCardDialog } from '@/components/create-card-dialog';
import { ImportCardsDialog } from '@/components/import-cards-dialog';
import { Plus, MoreHorizontal, Edit2, Trash2, Upload } from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  deckName: string;
  createdAt: string;
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);
  const [creatingCard, setCreatingCard] = useState(false);
  const [importingCards, setImportingCards] = useState(false);

  const fetchFlashcards = async () => {
    try {
      const response = await fetch('/api/cards');
      if (!response.ok) {
        throw new Error('Failed to fetch flashcards');
      }
      const data = await response.json();
      setFlashcards(data);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      toast.error('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const handleDelete = async (cardId: string) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      setFlashcards(prev => prev.filter(card => card.id !== cardId));
      toast.success('Card deleted successfully');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    }
  };

  interface TruncationResult {
    truncated: boolean;
    displayText: string;
    fullText?: string;
  }

  const truncateText = (text: string, maxLength: number = 100): TruncationResult => {
    if (text.length <= maxLength) {
      return { truncated: false, displayText: text };
    }
    return {
      truncated: true,
      displayText: text.substring(0, maxLength) + '...',
      fullText: text
    };
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-96" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Flashcards</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and manage all your flashcards across decks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setImportingCards(true)} size="lg" variant="outline" className="shrink-0 shadow-sm">
            <Upload className="mr-2 h-5 w-5" />
            Import
          </Button>
          <Button onClick={() => setCreatingCard(true)} size="lg" className="shrink-0 shadow-sm">
            <Plus className="mr-2 h-5 w-5" />
            New Card
          </Button>
        </div>
      </div>

      <div className="space-y-6">

        {flashcards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center animate-in fade-in-50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
              <MoreHorizontal className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No flashcards yet</h3>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto mb-8">
              You don't have any flashcards. Create some cards in your decks to see them here.
            </p>

          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deck</TableHead>
                    <TableHead>Front Content</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="sticky right-0 w-[100px] bg-background border-l border-border"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flashcards.map((card) => (
                    <TableRow key={card.id} className="group">
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link
                          href={`/decks/${card.deckId}`}
                          className="text-primary hover:underline"
                        >
                          {card.deckName}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {(() => {
                          const truncationResult = truncateText(card.front);
                          const isTruncated = truncationResult.truncated;
                          const displayText = truncationResult.displayText;
                          const fullText = truncationResult.fullText || displayText;

                          if (isTruncated) {
                            return (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <span className="cursor-pointer hover:bg-muted/50 p-1 rounded block truncate transition-colors">
                                    {displayText}
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0 overflow-hidden" align="start">
                                  <div className="border-l-2 border-l-primary bg-card p-4">
                                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                      {fullText}
                                    </p>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            );
                          } else {
                            return <span className="block truncate">{displayText}</span>;
                          }
                        })()}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(card.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="sticky right-0 w-[100px] bg-background group-hover:bg-muted/50 transition-colors border-l border-border">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCard(card)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingCard(card)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Edit Card Dialog */}
        {editingCard && (
          <EditCardDialog
            card={editingCard}
            open={!!editingCard}
            onOpenChange={(open) => {
              if (!open) setEditingCard(null);
            }}
            onSuccess={() => {
              setEditingCard(null);
              fetchFlashcards();
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deletingCard && (
          <DeleteConfirmDialog
            open={!!deletingCard}
            onOpenChange={(open) => {
              if (!open) setDeletingCard(null);
            }}
            onConfirm={() => {
              if (deletingCard) {
                handleDelete(deletingCard.id);
                setDeletingCard(null);
              }
            }}
            title="Delete Card"
            description="Are you sure you want to delete this card? This action cannot be undone."
          />
        )}

        {/* Create Card Dialog */}
        <CreateCardDialog
          open={creatingCard}
          onOpenChange={(open) => {
            setCreatingCard(open);
          }}
          onSuccess={() => {
            setCreatingCard(false);
            fetchFlashcards();
          }}
        />

        {/* Import Cards Dialog */}
        <ImportCardsDialog
          open={importingCards}
          onOpenChange={setImportingCards}
          onSuccess={fetchFlashcards}
        />
      </div>
    </div>
  );
}