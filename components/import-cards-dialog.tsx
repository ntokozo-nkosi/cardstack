'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface ImportCardsDialogProps {
    deckId?: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

interface ParsedCard {
    front: string
    back: string
}

export function ImportCardsDialog({
    deckId: initialDeckId,
    open,
    onOpenChange,
    onSuccess,
}: ImportCardsDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const [parsedCards, setParsedCards] = useState<ParsedCard[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [decks, setDecks] = useState<Array<{ id: string; name: string }>>([])
    const [selectedDeckId, setSelectedDeckId] = useState(initialDeckId || '')
    const [loadingDecks, setLoadingDecks] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch decks if not provided
    useEffect(() => {
        if (open && !initialDeckId) {
            fetchDecks()
        }
    }, [open, initialDeckId])

    useEffect(() => {
        if (initialDeckId) {
            setSelectedDeckId(initialDeckId)
        }
    }, [initialDeckId])

    const fetchDecks = async () => {
        setLoadingDecks(true)
        try {
            const response = await fetch('/api/decks')
            if (!response.ok) throw new Error('Failed to fetch decks')
            const data = await response.json()
            setDecks(data)
        } catch (error) {
            console.error('Error fetching decks:', error)
            toast.error('Failed to load decks')
        } finally {
            setLoadingDecks(false)
        }
    }

    const resetState = () => {
        setFile(null)
        setParsedCards([])
        setError(null)
        setIsParsing(false)
        setIsImporting(false)
        if (!initialDeckId) setSelectedDeckId('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetState()
        }
        onOpenChange(newOpen)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.')
            return
        }

        setFile(selectedFile)
        setError(null)
        parseCSV(selectedFile)
    }

    const parseCSV = (file: File) => {
        setIsParsing(true)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setIsParsing(false)

                if (results.errors.length > 0) {
                    console.error('CSV Parsing errors:', results.errors)
                    setError('Failed to parse CSV file. Please check the format.')
                    return
                }

                const data = results.data as any[]
                if (data.length === 0) {
                    setError('The CSV file is empty.')
                    return
                }

                const fields = results.meta.fields || []
                const frontField = fields.find(f => f.toLowerCase() === 'front') || fields[0]
                const backField = fields.find(f => f.toLowerCase() === 'back') || fields[1]

                if (!frontField || !backField) {
                    setError('Could not identify "front" and "back" columns. Please ensure your CSV has headers or use the standard format.')
                    return;
                }

                const validCards: ParsedCard[] = data
                    .map((row) => ({
                        front: row[frontField]?.trim(),
                        back: row[backField]?.trim(),
                    }))
                    .filter((card) => card.front && card.back)

                if (validCards.length === 0) {
                    setError('No valid cards found in the CSV. Ensure columns are not empty.')
                    return
                }

                if (validCards.length > 250) {
                    setError('Import limit exceeded. You can only import up to 250 cards at a time.')
                    return
                }

                setParsedCards(validCards)
            },
            error: (error) => {
                setIsParsing(false)
                console.error('CSV Parse Error:', error)
                setError('An error occurred while reading the file.')
            }
        })
    }

    const handleImport = async () => {
        const targetDeckId = initialDeckId || selectedDeckId
        if (parsedCards.length === 0 || !targetDeckId) return

        setIsImporting(true)
        try {
            const response = await fetch(`/api/decks/${targetDeckId}/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cards: parsedCards }),
            })

            if (!response.ok) {
                throw new Error('Failed to import cards')
            }

            const count = parsedCards.length
            toast.success(`Successfully imported ${count} card${count !== 1 ? 's' : ''}`)
            onSuccess()
            handleOpenChange(false)
        } catch (error) {
            console.error('Import error:', error)
            toast.error('Failed to import cards. Please try again.')
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import Cards</DialogTitle>
                    <DialogDescription>
                        {initialDeckId
                            ? 'Upload a CSV file to bulk import flashcards. The file should have headers for "front" and "back".'
                            : 'Select a deck and upload a CSV file to bulk import flashcards.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!initialDeckId && (
                        <div className="space-y-2">
                            <Label>Select Deck</Label>
                            {loadingDecks ? (
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground p-2 border rounded-md">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Loading decks...</span>
                                </div>
                            ) : decks.length === 0 ? (
                                <div className="p-3 border rounded-md bg-muted/20 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">No decks found.</p>
                                    <Button variant="link" asChild className="h-auto p-0">
                                        <Link href="/decks">Create a deck first</Link>
                                    </Button>
                                </div>
                            ) : (
                                <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a deck..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {decks.map(deck => (
                                            <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        {!file ? (
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors ${!initialDeckId && !selectedDeckId ? 'opacity-50 pointer-events-none' : ''}`}
                                onClick={() => {
                                    if (initialDeckId || selectedDeckId) {
                                        fileInputRef.current?.click()
                                    }
                                }}
                            >
                                <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                                <p className="text-sm font-medium">Click to upload CSV</p>
                                <p className="text-xs text-muted-foreground mt-1">or drag and drop here</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Upload className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={resetState}>Change</Button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {isParsing && (
                        <div className="flex items-center justify-center py-4 text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Parsing CSV...
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 flex items-start gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {parsedCards.length > 0 && !error && (
                        <div className="rounded-md bg-green-500/10 p-3 flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>Ready to import <strong>{parsedCards.length}</strong> cards.</p>
                        </div>
                    )}

                    {parsedCards.length > 0 && (
                        <div className="max-h-[200px] overflow-y-auto border rounded-md text-xs">
                            <table className="w-full">
                                <thead className="bg-muted sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left font-medium">Front</th>
                                        <th className="p-2 text-left font-medium">Back</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedCards.slice(0, 5).map((card, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="p-2 truncate max-w-[150px]">{card.front}</td>
                                            <td className="p-2 truncate max-w-[150px]">{card.back}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {parsedCards.length > 5 && (
                                <div className="p-2 text-center text-muted-foreground bg-muted/5 border-t">
                                    ...and {parsedCards.length - 5} more
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={parsedCards.length === 0 || isImporting || isParsing || (!initialDeckId && !selectedDeckId)}
                    >
                        {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import Cards
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
