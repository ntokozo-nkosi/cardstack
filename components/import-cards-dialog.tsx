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
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import { useDecks } from '@/hooks/use-decks'
import { useAppStore } from '@/lib/stores/app-store'

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
    const [csvText, setCsvText] = useState('')
    const [activeTab, setActiveTab] = useState('file')
    const [parsedCards, setParsedCards] = useState<ParsedCard[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedDeckId, setSelectedDeckId] = useState(initialDeckId || '')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { decks, isLoading: loadingDecks } = useDecks()
    const incrementDeckCardCount = useAppStore((state) => state.incrementDeckCardCount)

    useEffect(() => {
        if (initialDeckId) {
            setSelectedDeckId(initialDeckId)
        }
    }, [initialDeckId])

    const resetState = () => {
        setFile(null)
        setCsvText('')
        setParsedCards([])
        setError(null)
        setIsParsing(false)
        setIsImporting(false)
        setActiveTab('file')
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

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setError(null)
        setParsedCards([]) // Clear parsed cards when switching tabs to avoid confusion

        // Don't clear inputs, so user can switch back
        if (value === 'file' && file) {
            parseCSV(file)
        } else if (value === 'text' && csvText) {
            parseText(csvText)
        }
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

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value
        setCsvText(text)
        if (text.trim()) {
            setError(null)
            parseText(text)
        } else {
            setParsedCards([])
        }
    }

    const processParseResults = (results: Papa.ParseResult<any>) => {
        setIsParsing(false)

        if (results.errors.length > 0) {
            console.error('CSV Parsing errors:', results.errors)
            // Only show error if it's a critical failure, some CSVs have minor warnings
            if (results.data.length === 0) {
                setError('Failed to parse CSV data. Please check the format.')
                return
            }
        }

        const data = results.data as any[]
        if (data.length === 0) {
            setError('The CSV data is empty.')
            return
        }

        const fields = results.meta.fields || []
        const frontField = fields.find(f => f.toLowerCase() === 'front') || fields[0]
        const backField = fields.find(f => f.toLowerCase() === 'back') || fields[1]

        if (!frontField || !backField) {
            setError('Could not identify "front" and "back" columns. Please ensure headers are present.')
            return;
        }

        const validCards: ParsedCard[] = data
            .map((row) => ({
                front: row[frontField]?.trim(),
                back: row[backField]?.trim(),
            }))
            .filter((card) => card.front && card.back)
            .filter((card) => {
                // Skip rows that match header names
                const isHeaderRow = card.front.toLowerCase() === frontField.toLowerCase() &&
                    card.back.toLowerCase() === backField.toLowerCase()
                return !isHeaderRow
            })

        if (validCards.length === 0) {
            setError('No valid cards found. Ensure columns are not empty.')
            return
        }

        if (validCards.length > 250) {
            setError('Import limit exceeded. You can only import up to 250 cards at a time.')
            return
        }

        setParsedCards(validCards)
    }

    const parseCSV = (file: File) => {
        setIsParsing(true)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: processParseResults,
            error: (error) => {
                setIsParsing(false)
                console.error('CSV Parse Error:', error)
                setError('An error occurred while reading the file.')
            }
        })
    }

    const parseText = (text: string) => {
        setIsParsing(true)
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: processParseResults,
            error: (error: Error) => {
                setIsParsing(false)
                console.error('CSV Text Parse Error:', error)
                setError('An error occurred while parsing the text.')
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
            incrementDeckCardCount(targetDeckId, count)
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
            <DialogContent className="sm:max-w-[600px] h-[80vh] sm:h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Cards</DialogTitle>
                    <DialogDescription>
                        {initialDeckId
                            ? 'Import flashcards from a CSV file or text. Headers "front" and "back" are required.'
                            : 'Select a deck and import flashcards from a CSV file or text.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4">
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

                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="file">Upload File</TabsTrigger>
                            <TabsTrigger value="text">Paste Text</TabsTrigger>
                        </TabsList>

                        <TabsContent value="file" className="space-y-4">
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
                                        <div className="text-sm font-medium">Click to upload CSV</div>
                                        <div className="text-xs text-muted-foreground mt-1">or drag and drop here</div>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => { setFile(null); setParsedCards([]); }}>Change</Button>
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
                        </TabsContent>

                        <TabsContent value="text" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="csv-input" className="sr-only">CSV Content</Label>
                                <Textarea
                                    id="csv-input"
                                    placeholder={`front,back\n"Question 1","Answer 1"\n"Question 2","Answer 2"`}
                                    className="font-mono text-xs min-h-[200px]"
                                    value={csvText}
                                    onChange={handleTextChange}
                                    disabled={!initialDeckId && !selectedDeckId}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    {isParsing && (
                        <div className="flex items-center justify-center py-2 text-muted-foreground text-sm">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Parsing...
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 flex items-start gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {parsedCards.length > 0 && !error && (
                        <div className="space-y-3">
                            <div className="rounded-md bg-green-500/10 p-3 flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>Ready to import <strong>{parsedCards.length}</strong> cards.</p>
                            </div>

                            <div className="max-h-[150px] overflow-y-auto border rounded-md text-xs">
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
