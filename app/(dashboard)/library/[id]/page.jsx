'use client'
import { useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'

// Deep-links directly to a video workspace via URL (/library/:id)
// Sets the AppContext state so AppShell renders Library → VideoWorkspace
function LibraryVideoPage() {
  const { id } = useParams()
  const { set } = useApp()

  useEffect(() => {
    if (id) {
      set({ page: 'library', libSelectedVideo: id, videoDetailTab: 'overview' })
    }
  }, [id])

  return <AppShell />
}

export default function LibraryVideoPageWrapper() {
  return (
    <Suspense fallback={null}>
      <LibraryVideoPage />
    </Suspense>
  )
}
