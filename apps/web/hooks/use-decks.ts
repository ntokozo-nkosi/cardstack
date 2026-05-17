'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/stores/app-store'

export function useDecks() {
  const decks = useAppStore((state) => state.decks)
  const decksLoaded = useAppStore((state) => state.decksLoaded)
  const decksLoading = useAppStore((state) => state.decksLoading)
  const decksError = useAppStore((state) => state.decksError)
  const ensureDecksLoaded = useAppStore((state) => state.ensureDecksLoaded)

  useEffect(() => {
    ensureDecksLoaded()
  }, [ensureDecksLoaded])

  return {
    decks,
    isLoaded: decksLoaded,
    isLoading: decksLoading,
    error: decksError,
  }
}
