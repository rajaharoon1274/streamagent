'use client'

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

export default function VideoList({ videos, onSelect }) {
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, overflow: 'hidden' }}>
      {videos.map((v, i) => {
        const last      = i === videos.length - 1
        const vStatus   = v.privacy || v.status
        const isPub     = vStatus === 'published'
        const statusBg  = isPub ? 'rgba(30,216,160,0.1)' : 'rgba(255,255,255,0.05)'
        const statusClr = isPub ? 'var(--grn)' : 'var(--t3)'

        return (
          <div
            key={v.id}
            draggable
            onDragStart={e => e.dataTransfer.setData('videoId', String(v.id))}
            onClick={() => onSelect(v)}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--s3)' }}
            onMouseOut={e  => { e.currentTarget.style.background = '' }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer', borderBottom: last ? 'none' : '1px solid var(--b1)' }}
          >
            {/* Colour thumbnail */}
            <div style={{ width: 60, height: 38, borderRadius: 7, background: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PlayIcon />
            </div>

            {/* Title + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{v.dur} · {v.views.toLocaleString()} views</div>
            </div>

            {/* Status pill */}
            <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: statusBg, color: statusClr, flexShrink: 0 }}>
              {vStatus || 'draft'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
