'use client'
import StatCards        from './StatCards'
import WatchDepthHeatmap from './WatchDepthHeatmap'
import QuickActions     from './QuickActions'
import CloneElementsCard from './CloneElementsCard'
import AIFeaturesCard   from './AIFeaturesCard'

export default function OverviewTab({ video, accentColor }) {
  return (
    <div style={{ padding: '20px 0' }}>
      <StatCards         video={video} />
      <WatchDepthHeatmap video={video} />
      <QuickActions      video={video} />
      <CloneElementsCard video={video} />
      <AIFeaturesCard    video={video} />
    </div>
  )
}
