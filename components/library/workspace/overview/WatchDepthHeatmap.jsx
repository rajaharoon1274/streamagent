'use client'
import { HEATMAP } from '@/lib/mockData'

const LEGEND = [
  { color: '#1ED8A0', label: 'High retention' },
  { color: '#4F6EF7', label: 'Good' },
  { color: '#F5A623', label: 'Drop-off' },
  { color: '#FF6B6B', label: 'Low' },
]

function barColor(pct) {
  if (pct > 75) return '#1ED8A0'
  if (pct > 50) return '#4F6EF7'
  if (pct > 30) return '#F5A623'
  return '#FF6B6B'
}

export default function WatchDepthHeatmap({ video: v }) {
  const hmMax = Math.max(...HEATMAP)

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>📈 Watch Depth</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Viewer retention across the video timeline</div>
        </div>
        <button style={{ fontSize: 11, color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Full Analytics →
        </button>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80, marginTop: 12 }}>
        {HEATMAP.map((val, i) => {
          const pct = Math.round((val / hmMax) * 100)
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${pct}%`,
                minHeight: 3,
                borderRadius: '3px 3px 0 0',
                background: barColor(pct),
                opacity: 0.85,
              }}
            />
          )
        })}
      </div>

      {/* Time labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--t3)' }}>
        <span>0:00</span>
        <span>{v.dur}</span>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {LEGEND.map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t3)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}
