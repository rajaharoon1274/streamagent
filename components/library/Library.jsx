'use client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { useLibrary } from '@/hooks/useLibrary'
import FolderSidebar from './FolderSidebar'
import LibraryToolbar from './LibraryToolbar'
import VideoGrid from './VideoGrid'
import VideoList from './VideoList'
import VideoWorkspace from './workspace/VideoWorkspace'

export default function Library() {
  const router = useRouter()
  const { state, set } = useApp()
  const { videos, folders, isLoading, isError, mutate, createFolder } = useLibrary()

  // ── If a video is selected → show the workspace ──────────────────────────
  if (state.libSelectedVideo) {
    const video = videos.find(v => v.id === state.libSelectedVideo)
    if (video) return <VideoWorkspace video={video} />
  }

  // ── Filter videos ────────────────────────────────────────────────────────
  const filtered = videos.filter(v => {
    // Folder filter
    if (state.libFolder === '__uncategorized__') {
      if (v.folder && folders.find(f => f.id === v.folder)) return false
    } else if (state.libFolder) {
      if (v.folder !== state.libFolder) return false
    }
    // Status filter (all / published / draft)
    if (state.libFilter && state.libFilter !== 'all') {
      const vStatus = v.privacy || v.status
      if (vStatus !== state.libFilter) return false
    }
    // Search filter
    if (state.libSearch) {
      if (!v.title.toLowerCase().includes(state.libSearch.toLowerCase())) return false
    }
    return true
  })

  const selectVideo = (v) => {
    set({ libSelectedVideo: v.id, videoDetailTab: 'overview' })
    // Also update URL to /library/:id
    router.push(`/library/${v.id}`)
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <FolderSidebar folders={folders} videos={videos} onCreateFolder={createFolder} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--t2)', marginBottom: 12 }}>Could not load your videos. Please refresh.</p>
            <button onClick={() => mutate()} style={{ padding: '8px 18px', borderRadius: 9, background: 'var(--acc)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <FolderSidebar folders={folders} videos={videos} onCreateFolder={createFolder} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>Loading your videos...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <FolderSidebar folders={folders} videos={videos} />

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <LibraryToolbar filteredCount={filtered.length} folders={folders} />

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🎬</div>
              <div style={{ fontSize: 14, color: 'var(--t3)' }}>
                {videos.length === 0 ? 'No videos yet' : 'No videos found'}
              </div>
              {videos.length === 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12 }}>Upload your first video to get started</div>
                  <button onClick={() => set({ page: 'upload' })} style={{ padding: '9px 22px', borderRadius: 9, background: 'var(--acc)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    Upload Video
                  </button>
                </div>
              )}
            </div>
          ) : state.libView === 'grid' ? (
            <VideoGrid videos={filtered} onSelect={selectVideo} />
          ) : (
            <VideoList videos={filtered} onSelect={selectVideo} />
          )}
        </div>
      </div>
    </div>
  )
}
