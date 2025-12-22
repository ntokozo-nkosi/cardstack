import { create } from 'zustand'

// Types
export interface Deck {
  id: string
  name: string
  description: string | null
  _count: {
    cards: number
  }
}

export interface Collection {
  id: string
  name: string
  description: string | null
  _count: {
    decks: number
  }
}

// Extended collection with full details for detail page
export interface CollectionDetails {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export interface DeckInput {
  name: string
  description?: string | null
}

export interface CollectionInput {
  name: string
  description?: string | null
}

interface AppState {
  // Decks state
  decks: Deck[]
  decksLoaded: boolean
  decksLoading: boolean
  decksError: string | null

  // Collections state
  collections: Collection[]
  collectionsLoaded: boolean
  collectionsLoading: boolean
  collectionsError: string | null

  // Collection decks state (keyed by collectionId)
  collectionDecks: Record<string, Deck[]>
  collectionDecksLoading: Record<string, boolean>
  collectionDetails: Record<string, CollectionDetails>

  // Deck actions
  fetchDecks: () => Promise<void>
  ensureDecksLoaded: () => Promise<void>
  addDeck: (input: DeckInput) => Promise<Deck | null>
  updateDeck: (id: string, input: DeckInput) => Promise<boolean>
  deleteDeck: (id: string) => Promise<boolean>
  incrementDeckCardCount: (deckId: string, amount?: number) => void
  decrementDeckCardCount: (deckId: string, amount?: number) => void

  // Collection actions
  fetchCollections: () => Promise<void>
  ensureCollectionsLoaded: () => Promise<void>
  addCollection: (input: CollectionInput) => Promise<Collection | null>
  updateCollection: (id: string, input: CollectionInput) => Promise<boolean>
  deleteCollection: (id: string) => Promise<boolean>
  incrementCollectionDeckCount: (collectionId: string) => void
  decrementCollectionDeckCount: (collectionId: string) => void

  // Collection decks actions
  setCollectionDecks: (collectionId: string, decks: Deck[]) => void
  setCollectionDetails: (collectionId: string, details: CollectionDetails) => void
  fetchCollectionDecks: (collectionId: string) => Promise<void>
  addDeckToCollection: (collectionId: string, deckId: string) => Promise<boolean>
  removeDeckFromCollection: (collectionId: string, deckId: string) => Promise<boolean>
  createDeckInCollection: (collectionId: string, input: DeckInput) => Promise<Deck | null>

  // Utility actions
  reset: () => void
}

const initialState = {
  decks: [],
  decksLoaded: false,
  decksLoading: false,
  decksError: null,
  collections: [],
  collectionsLoaded: false,
  collectionsLoading: false,
  collectionsError: null,
  collectionDecks: {} as Record<string, Deck[]>,
  collectionDecksLoading: {} as Record<string, boolean>,
  collectionDetails: {} as Record<string, CollectionDetails>,
}

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  // Fetch all decks
  fetchDecks: async () => {
    if (get().decksLoading) return

    set({ decksLoading: true, decksError: null })

    try {
      const response = await fetch('/api/decks')
      if (!response.ok) throw new Error('Failed to fetch decks')
      const decks = await response.json()
      set({ decks, decksLoaded: true, decksLoading: false })
    } catch (error) {
      set({
        decksError: error instanceof Error ? error.message : 'Unknown error',
        decksLoading: false,
      })
    }
  },

  // Ensure decks are loaded (lazy loading helper)
  ensureDecksLoaded: async () => {
    const { decksLoaded, decksLoading, fetchDecks } = get()
    if (!decksLoaded && !decksLoading) {
      await fetchDecks()
    }
  },

  // Add deck with optimistic update
  addDeck: async (input) => {
    const tempId = `temp-${Date.now()}`
    const optimisticDeck: Deck = {
      id: tempId,
      name: input.name,
      description: input.description || null,
      _count: { cards: 0 },
    }

    // Optimistic add
    set((state) => ({ decks: [optimisticDeck, ...state.decks] }))

    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) throw new Error('Failed to create deck')

      const newDeck = await response.json()
      const realDeck: Deck = { ...newDeck, _count: { cards: 0 } }

      // Replace temp with real
      set((state) => ({
        decks: state.decks.map((d) => (d.id === tempId ? realDeck : d)),
      }))

      return realDeck
    } catch (error) {
      // Rollback
      set((state) => ({
        decks: state.decks.filter((d) => d.id !== tempId),
      }))
      return null
    }
  },

  // Update deck with optimistic update
  updateDeck: async (id, input) => {
    const originalDeck = get().decks.find((d) => d.id === id)
    if (!originalDeck) return false

    // Optimistic update
    set((state) => ({
      decks: state.decks.map((d) => (d.id === id ? { ...d, ...input } : d)),
    }))

    try {
      const response = await fetch(`/api/decks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) throw new Error('Failed to update deck')
      return true
    } catch (error) {
      // Rollback
      set((state) => ({
        decks: state.decks.map((d) => (d.id === id ? originalDeck : d)),
      }))
      return false
    }
  },

  // Delete deck with optimistic update
  deleteDeck: async (id) => {
    const originalDecks = get().decks

    // Optimistic delete
    set((state) => ({
      decks: state.decks.filter((d) => d.id !== id),
    }))

    try {
      const response = await fetch(`/api/decks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete deck')
      return true
    } catch (error) {
      // Rollback
      set({ decks: originalDecks })
      return false
    }
  },

  // Count helpers for decks
  incrementDeckCardCount: (deckId, amount = 1) => {
    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, _count: { cards: d._count.cards + amount } } : d
      ),
    }))
  },

  decrementDeckCardCount: (deckId, amount = 1) => {
    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId
          ? { ...d, _count: { cards: Math.max(0, d._count.cards - amount) } }
          : d
      ),
    }))
  },

  // Fetch all collections
  fetchCollections: async () => {
    if (get().collectionsLoading) return

    set({ collectionsLoading: true, collectionsError: null })

    try {
      const response = await fetch('/api/collections')
      if (!response.ok) throw new Error('Failed to fetch collections')
      const collections = await response.json()
      set({ collections, collectionsLoaded: true, collectionsLoading: false })
    } catch (error) {
      set({
        collectionsError: error instanceof Error ? error.message : 'Unknown error',
        collectionsLoading: false,
      })
    }
  },

  // Ensure collections are loaded (lazy loading helper)
  ensureCollectionsLoaded: async () => {
    const { collectionsLoaded, collectionsLoading, fetchCollections } = get()
    if (!collectionsLoaded && !collectionsLoading) {
      await fetchCollections()
    }
  },

  // Add collection with optimistic update
  addCollection: async (input) => {
    const tempId = `temp-${Date.now()}`
    const optimisticCollection: Collection = {
      id: tempId,
      name: input.name,
      description: input.description || null,
      _count: { decks: 0 },
    }

    set((state) => ({ collections: [optimisticCollection, ...state.collections] }))

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) throw new Error('Failed to create collection')

      const newCollection = await response.json()
      const realCollection: Collection = { ...newCollection, _count: { decks: 0 } }

      set((state) => ({
        collections: state.collections.map((c) =>
          c.id === tempId ? realCollection : c
        ),
      }))

      return realCollection
    } catch (error) {
      set((state) => ({
        collections: state.collections.filter((c) => c.id !== tempId),
      }))
      return null
    }
  },

  // Update collection with optimistic update
  updateCollection: async (id, input) => {
    const originalCollection = get().collections.find((c) => c.id === id)
    if (!originalCollection) return false

    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, ...input } : c
      ),
    }))

    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) throw new Error('Failed to update collection')
      return true
    } catch (error) {
      set((state) => ({
        collections: state.collections.map((c) =>
          c.id === id ? originalCollection : c
        ),
      }))
      return false
    }
  },

  // Delete collection with optimistic update
  deleteCollection: async (id) => {
    const originalCollections = get().collections

    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    }))

    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete collection')
      return true
    } catch (error) {
      set({ collections: originalCollections })
      return false
    }
  },

  // Count helpers for collections
  incrementCollectionDeckCount: (collectionId) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId ? { ...c, _count: { decks: c._count.decks + 1 } } : c
      ),
    }))
  },

  decrementCollectionDeckCount: (collectionId) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? { ...c, _count: { decks: Math.max(0, c._count.decks - 1) } }
          : c
      ),
    }))
  },

  // Set collection decks directly (used when fetching full collection data)
  setCollectionDecks: (collectionId, decks) => {
    set((state) => ({
      collectionDecks: { ...state.collectionDecks, [collectionId]: decks },
    }))
  },

  // Set collection details directly (used when fetching full collection data)
  setCollectionDetails: (collectionId, details) => {
    set((state) => ({
      collectionDetails: { ...state.collectionDetails, [collectionId]: details },
    }))
  },

  // Fetch decks for a specific collection
  fetchCollectionDecks: async (collectionId) => {
    const { collectionDecksLoading } = get()
    if (collectionDecksLoading[collectionId]) return

    set((state) => ({
      collectionDecksLoading: { ...state.collectionDecksLoading, [collectionId]: true },
    }))

    try {
      const response = await fetch(`/api/collections/${collectionId}`)
      if (!response.ok) throw new Error('Failed to fetch collection')
      const collection = await response.json()
      set((state) => ({
        collectionDecks: { ...state.collectionDecks, [collectionId]: collection.decks || [] },
        collectionDecksLoading: { ...state.collectionDecksLoading, [collectionId]: false },
        collectionDetails: {
          ...state.collectionDetails,
          [collectionId]: {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            createdAt: collection.createdAt
          }
        },
      }))
    } catch (error) {
      set((state) => ({
        collectionDecksLoading: { ...state.collectionDecksLoading, [collectionId]: false },
      }))
    }
  },

  // Add existing deck to collection
  addDeckToCollection: async (collectionId, deckId) => {
    const { decks, collectionDecks, incrementCollectionDeckCount } = get()
    const deckToAdd = decks.find((d) => d.id === deckId)

    if (!deckToAdd) return false

    // Optimistic update
    const currentDecks = collectionDecks[collectionId] || []
    set((state) => ({
      collectionDecks: {
        ...state.collectionDecks,
        [collectionId]: [...currentDecks, deckToAdd],
      },
    }))
    incrementCollectionDeckCount(collectionId)

    try {
      const response = await fetch(`/api/collections/${collectionId}/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId }),
      })

      if (!response.ok) throw new Error('Failed to add deck to collection')
      return true
    } catch (error) {
      // Rollback
      set((state) => ({
        collectionDecks: {
          ...state.collectionDecks,
          [collectionId]: currentDecks,
        },
      }))
      get().decrementCollectionDeckCount(collectionId)
      return false
    }
  },

  // Remove deck from collection
  removeDeckFromCollection: async (collectionId, deckId) => {
    const { collectionDecks, decrementCollectionDeckCount } = get()
    const currentDecks = collectionDecks[collectionId] || []

    // Optimistic update
    set((state) => ({
      collectionDecks: {
        ...state.collectionDecks,
        [collectionId]: currentDecks.filter((d) => d.id !== deckId),
      },
    }))
    decrementCollectionDeckCount(collectionId)

    try {
      const response = await fetch(`/api/collections/${collectionId}/decks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId }),
      })

      if (!response.ok) throw new Error('Failed to remove deck from collection')
      return true
    } catch (error) {
      // Rollback
      set((state) => ({
        collectionDecks: {
          ...state.collectionDecks,
          [collectionId]: currentDecks,
        },
      }))
      get().incrementCollectionDeckCount(collectionId)
      return false
    }
  },

  // Create a new deck in a collection
  createDeckInCollection: async (collectionId, input) => {
    const tempId = `temp-${Date.now()}`
    const optimisticDeck: Deck = {
      id: tempId,
      name: input.name,
      description: input.description || null,
      _count: { cards: 0 },
    }

    const { collectionDecks, incrementCollectionDeckCount } = get()
    const currentDecks = collectionDecks[collectionId] || []

    // Optimistic update - add to both decks and collectionDecks
    set((state) => ({
      decks: [optimisticDeck, ...state.decks],
      collectionDecks: {
        ...state.collectionDecks,
        [collectionId]: [...currentDecks, optimisticDeck],
      },
    }))
    incrementCollectionDeckCount(collectionId)

    try {
      const response = await fetch(`/api/collections/${collectionId}/create-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) throw new Error('Failed to create deck in collection')

      const newDeck = await response.json()
      const realDeck: Deck = { ...newDeck, _count: { cards: 0 } }

      // Replace temp with real in both decks and collectionDecks
      set((state) => ({
        decks: state.decks.map((d) => (d.id === tempId ? realDeck : d)),
        collectionDecks: {
          ...state.collectionDecks,
          [collectionId]: (state.collectionDecks[collectionId] || []).map((d) =>
            d.id === tempId ? realDeck : d
          ),
        },
      }))

      return realDeck
    } catch (error) {
      // Rollback
      set((state) => ({
        decks: state.decks.filter((d) => d.id !== tempId),
        collectionDecks: {
          ...state.collectionDecks,
          [collectionId]: currentDecks,
        },
      }))
      get().decrementCollectionDeckCount(collectionId)
      return null
    }
  },

  // Reset store to initial state
  reset: () => set(initialState),
}))
