'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { useVideo }    from '@/hooks/useVideo'
import { useElements } from '@/hooks/useElements'

// ── Context ───────────────────────────────────────────────────────────────────
const LibraryContext = createContext(null)

// ── Provider ──────────────────────────────────────────────────────────────────
export function LibraryProvider({ videoId, children }) {
  const { video, isLoading: videoLoading, refresh: refreshVideo } = useVideo(videoId)
  const {
    elements,
    isLoading:        elementsLoading,
    isError:          elementsError,
    createElement,
    updateElement,
    deleteElement,
    bulkSaveElements,
    refresh:          refreshElements,
  } = useElements(videoId)

  // Derived state
  const isLoading = videoLoading || elementsLoading
  const accentColor = video?.color || video?.branding?.primaryColor || '#4F6EF7'

  // Refresh everything
  const refresh = useCallback(() => {
    refreshVideo()
    refreshElements()
  }, [refreshVideo, refreshElements])

  const value = {
    // Video
    video,
    videoLoading,
    accentColor,
    refreshVideo,

    // Elements
    elements,
    elementsLoading,
    elementsError,
    createElement,
    updateElement,
    deleteElement,
    bulkSaveElements,
    refreshElements,

    // Combined
    isLoading,
    refresh,
  }

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>')
  return ctx
}