import useSWR from 'swr'
import { useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

const fetcher = (url) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
})

// Normalize DB snake_case columns to camelCase for existing components
function normalizeVideo(v) {
  if (!v) return v
  const dur = v.duration_seconds
    ? `${Math.floor(v.duration_seconds / 60)}:${String(v.duration_seconds % 60).padStart(2, '0')}`
    : v.dur || '—'
  const bytes = v.file_size_bytes
  const fileSize = bytes
    ? bytes > 1073741824 ? `${(bytes / 1073741824).toFixed(1)} GB`
    : bytes > 1048576 ? `${(bytes / 1048576).toFixed(0)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`
    : v.fileSize || '—'
  return {
    ...v,
    aspectRatio: v.aspect_ratio || v.aspectRatio || '16:9',
    fileSize,
    uploadDate: v.upload_date || v.uploadDate || '—',
    uploadedBy: v.uploaded_by || v.uploadedBy || 'You',
    dur,
    views: v.views ?? 0,
    plays: v.plays ?? 0,
    eng: v.eng ?? 0,
    color: v.color || v.branding?.color || '#4F6EF7',
    folder: v.folder_id || v.folder || null,
  }
}

export function useVideos(filters = {}) {
  const params = new URLSearchParams()
  if (filters.folder) params.set('folder', filters.folder)
  if (filters.status) params.set('status', filters.status)
  if (filters.sort)   params.set('sort',   filters.sort)

  const qs = params.toString()
  const url = `/api/videos${qs ? '?' + qs : ''}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    // Poll every 10s while any video is still in a transient state
    refreshInterval: (currentData) => {
      if (!Array.isArray(currentData)) return 0
      const hasTransient = currentData.some(
        v => v.status === 'uploading' || v.status === 'processing'
      )
      return hasTransient ? 10000 : 0
    },
    revalidateOnFocus: true,
    shouldRetryOnError: true,
    errorRetryCount: 3,
  })

  // Track previous statuses to detect processing → ready transitions
  const prevStatuses = useRef({})
  useEffect(() => {
    if (!Array.isArray(data)) return
    data.forEach(v => {
      const prev = prevStatuses.current[v.id]
      if (prev === 'processing' && v.status === 'ready') {
        toast.success(`"${v.title || 'Video'}" is ready to play! 🎬`, { duration: 5000 })
      }
      prevStatuses.current[v.id] = v.status
    })
  }, [data])

  return {
    videos:    Array.isArray(data) ? data.map(normalizeVideo) : [],
    isLoading,
    isError:   !!error,
    mutate,
  }
}

export function useVideo(id) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/videos/${id}` : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  return {
    video:     data ? normalizeVideo(data) : null,
    isLoading,
    isError:   !!error,
    mutate,
  }
}