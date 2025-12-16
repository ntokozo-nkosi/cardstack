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
import { Plus, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

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
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
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
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">All Flashcards</h1>
          <Button onClick={() => setCreatingCard(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Card
          </Button>
        </div>

        {flashcards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center animate-in fade-in-50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
              <MoreHorizontal className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No flashcards yet</h3>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto mb-8">
              You don't have any flashcards. Create some cards in your decks to see them here.
            </p>
            <Button asChild>
              <Link href="/decks">Browse Decks</Link>
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deck</TableHead>
                  <TableHead>Front Content</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flashcards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell>
                      <Link
                        href={`/decks/${card.deckId}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {card.deckName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const truncationResult = truncateText(card.front);
                        const isTruncated = truncationResult.truncated;
                        const displayText = truncationResult.displayText;
                        const fullText = truncationResult.fullText || displayText;

                        if (isTruncated) {
                          return (
                            <Popover>
                              <PopoverTrigger asChild>
                                <span className="cursor-pointer hover:bg-muted/50 p-1 rounded">
                                  {displayText}
                                </span>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Card Content</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {fullText}
                                  </p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          );
                        } else {
                          return <span>{displayText}</span>;
                        }
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(card.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
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
      </div>
    </div>
  );
}