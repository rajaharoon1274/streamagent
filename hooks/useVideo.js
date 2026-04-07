import useSWR from 'swr'

const fetcher = (url) => fetch(url).then(r => r.json())

export function useVideo(videoId) {
  const { data, error, isLoading, mutate } = useSWR(
    videoId ? `/api/videos/${videoId}` : null,
    fetcher
  )

  return {
    video:     data || null,
    isLoading,
    isError:   !!error,
    refresh:   mutate,
  }
}