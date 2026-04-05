import useSWR from 'swr'

const fetcher = (url) => fetch(url).then(r => r.json())

export function useFolders() {
  const { data, error, isLoading, mutate } = useSWR('/api/folders', fetcher)

  async function createFolder(name, color) {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Create failed')
    await mutate()
    return data
  }

  async function deleteFolder(id) {
    const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Delete failed')
    await mutate()
  }

  async function renameFolder(id, name) {
    const res = await fetch(`/api/folders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Rename failed')
    await mutate()
    return data
  }

  return {
    folders:  data || [],
    isLoading,
    isError:  !!error,
    createFolder,
    deleteFolder,
    renameFolder,
  }
}
