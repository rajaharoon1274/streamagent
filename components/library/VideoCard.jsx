'use client'

function EngBar({ val, color }) {
  return (
    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--b2)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 3 }} />
    </div>
  )
}

function PlayIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

export default function VideoCard({ video: v, onSelect }) {
  const isVert = v.aspectRatio === '9:16'
  const isSq   = v.aspectRatio === '1:1'
  const thumbH = isVert ? 160 : isSq ? 130 : 100

  const vStatus    = v.privacy || v.status
  const statusBg   = vStatus === 'published'          ? '#1ED8A0'
                   : vStatus === 'Password Protected' ? '#F5A623'
                   : '#6B7280'
  const statusLabel = vStatus === 'Password Protected' ? '🔒 Protected' : vStatus || 'draft'
  const engColor    = v.eng > 80 ? '#1ED8A0' : v.eng > 60 ? '#F5A623' : '#FF6B6B'

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('videoId', String(v.id))}
      onClick={() => onSelect(v)}
      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--acc)'}
      onMouseOut={e  => e.currentTarget.style.borderColor = 'var(--b2)'}
      style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
    >
      {/* ── Thumbnail ── */}
      <div style={{ height: thumbH, background: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {isVert ? (
          <div style={{ width: 56, height: 100, borderRadius: 6, border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}>
            <PlayIcon size={16} />
          </div>
        ) : isSq ? (
          <div style={{ width: 90, height: 90, borderRadius: 6, border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}>
            <PlayIcon size={16} />
          </div>
        ) : (
          <PlayIcon size={20} />
        )}

        {/* Duration — bottom-right */}
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 7px', fontSize: 10, color: '#fff' }}>
          {v.dur}
        </div>

        {/* Status — top-left */}
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: statusBg, color: '#fff', textTransform: 'uppercase' }}>
          {statusLabel}
        </div>

        {/* Aspect ratio badge — bottom-left (9:16 / 1:1 only) */}
        {isVert && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: 'rgba(168,85,247,0.9)', color: '#fff' }}>9:16</div>
        )}
        {isSq && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: 'rgba(6,182,212,0.9)', color: '#fff' }}>1:1</div>
        )}

        {/* Badge icon — top-right */}
        {v.badge && (
          <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 14 }}>
            {v.badge === 'top-performer' ? '🏆' : v.badge === 'rising' ? '📈' : ''}
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--t2)' }}>
          <span>{v.views.toLocaleString()} views</span>
          <span>·</span>
          <EngBar val={v.eng} color={engColor} />
          <span>{v.eng}%</span>
        </div>
      </div>
    </div>
  )
}
