'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/stores/app-store'

export function useCollections() {
  const collections = useAppStore((state) => state.collections)
  const collectionsLoaded = useAppStore((state) => state.collectionsLoaded)
  const collectionsLoading = useAppStore((state) => state.collectionsLoading)
  const collectionsError = useAppStore((state) => state.collectionsError)
  const ensureCollectionsLoaded = useAppStore((state) => state.ensureCollectionsLoaded)

  useEffect(() => {
    ensureCollectionsLoaded()
  }, [ensureCollectionsLoaded])

  return {
    collections,
    isLoaded: collectionsLoaded,
    isLoading: collectionsLoading,
    error: collectionsError,
  }
}
