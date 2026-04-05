import { useVideos } from './useVideos'

export function useVideoMutations() {
  const { mutate } = useVideos()

  async function updateVideo(id, updates) {
    const res = await fetch(`/api/videos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Update failed')
    await mutate() // revalidate the list
    return data
  }

  async function deleteVideo(id) {
    const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Delete failed')
    await mutate()
  }

  async function duplicateVideo(id) {
    // Fetch the original video
    const res = await fetch(`/api/videos/${id}`)
    if (!res.ok) throw new Error('Could not fetch video for duplication')

    // Create a new record pointing to the same Cloudflare stream_uid
    const dupRes = await fetch('/api/videos/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceVideoId: id }),
    })
    const dup = await dupRes.json()
    if (!dupRes.ok) throw new Error(dup.error || 'Duplication failed')
    await mutate()
    return dup
  }

  return { updateVideo, deleteVideo, duplicateVideo }
}
