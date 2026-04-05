'use client'
import VideoCard from './VideoCard'

export default function VideoGrid({ videos, onSelect }) {
  return (
    <div className="lib-grid">
      {videos.map(v => (
        <VideoCard key={v.id} video={v} onSelect={onSelect} />
      ))}
    </div>
  )
}
