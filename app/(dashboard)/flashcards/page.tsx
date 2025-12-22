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
import { Checkbox } from '@/components/ui/checkbox';
import { EditCardDialog } from '@/components/edit-card-dialog';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { CreateCardDialog } from '@/components/create-card-dialog';
import { ImportCardsDialog } from '@/components/import-cards-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, MoreHorizontal, Edit2, Trash2, Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/lib/stores/app-store';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  deckName: string;
  createdAt: string;
}

export default function FlashcardsPage() {
  const decrementDeckCardCount = useAppStore((state) => state.decrementDeckCardCount);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);
  const [creatingCard, setCreatingCard] = useState(false);
  const [importingCards, setImportingCards] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    setIsDeleting(true);
    try {
      const cardToDelete = flashcards.find(card => card.id === cardId);
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      if (cardToDelete) {
        decrementDeckCardCount(cardToDelete.deckId);
      }
      setFlashcards(prev => prev.filter(card => card.id !== cardId));
      toast.success('Card deleted successfully');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const cardIds = Array.from(selectedCards);
      // Count cards per deck before deletion
      const deckCounts = new Map<string, number>();
      flashcards.filter(card => selectedCards.has(card.id)).forEach(card => {
        deckCounts.set(card.deckId, (deckCounts.get(card.deckId) || 0) + 1);
      });

      const response = await fetch('/api/cards/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete cards');
      }

      const { deletedCount } = await response.json();

      // Update deck counts in store
      deckCounts.forEach((count, deckId) => {
        decrementDeckCardCount(deckId, count);
      });

      setFlashcards(prev => prev.filter(card => !selectedCards.has(card.id)));
      setSelectedCards(new Set());
      toast.success(`${deletedCount} card${deletedCount !== 1 ? 's' : ''} deleted successfully`);
    } catch (error) {
      console.error('Error deleting cards:', error);
      toast.error('Failed to delete cards');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const currentPageIds = paginatedFlashcards.map(card => card.id);
    const allCurrentPageSelected = currentPageIds.every(id => selectedCards.has(id));

    if (allCurrentPageSelected && currentPageIds.length > 0) {
      // Deselect all on current page
      setSelectedCards(prev => {
        const newSet = new Set(prev);
        currentPageIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all on current page
      setSelectedCards(prev => {
        const newSet = new Set(prev);
        currentPageIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(flashcards.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFlashcards = flashcards.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  interface TruncationResult {
    truncated: boolean;
    displayText: string;
    fullText?: string;
  }

  const truncateText = (text: string, maxLength: number = 50): TruncationResult => {
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
        {selectedCards.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
            <p className="text-sm font-medium">
              {selectedCards.size} card{selectedCards.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCards(new Set())}
                disabled={isDeleting}
              >
                Deselect All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleting(true)}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

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
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          paginatedFlashcards.length > 0 &&
                          paginatedFlashcards.every(card => selectedCards.has(card.id))
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all cards on this page"
                        disabled={isDeleting}
                      />
                    </TableHead>
                    <TableHead>Deck</TableHead>
                    <TableHead>Front Content</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="sticky right-0 w-[100px] bg-background border-l border-border"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFlashcards.map((card) => (
                    <TableRow key={card.id} className="group" style={{ opacity: isDeleting ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                      <TableCell className="w-[50px]">
                        <Checkbox
                          checked={selectedCards.has(card.id)}
                          onCheckedChange={() => toggleCardSelection(card.id)}
                          aria-label={`Select card ${card.id}`}
                          disabled={isDeleting}
                        />
                      </TableCell>
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
                                  <button type="button" className="text-left w-full cursor-pointer hover:bg-muted/50 p-1 rounded block truncate transition-colors outline-none">
                                    {displayText}
                                  </button>
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
                            disabled={isDeleting}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingCard(card)}
                            disabled={isDeleting}
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

            {/* Pagination Controls */}
            {flashcards.length > 10 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Show</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => handlePageSizeChange(Number(value))}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="40">40</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>
                    Showing {startIndex + 1}-{Math.min(endIndex, flashcards.length)} of {flashcards.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, index, array) => {
                        // Add ellipsis
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;

                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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

        {/* Bulk Delete Confirmation Dialog */}
        {bulkDeleting && (
          <DeleteConfirmDialog
            open={bulkDeleting}
            onOpenChange={(open) => {
              if (!open) setBulkDeleting(false);
            }}
            onConfirm={() => {
              handleBulkDelete();
              setBulkDeleting(false);
            }}
            title="Delete Cards"
            description={`Are you sure you want to delete ${selectedCards.size} card${selectedCards.size !== 1 ? 's' : ''}? This action cannot be undone.`}
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