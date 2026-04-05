'use client'
import { useApp } from '@/context/AppContext'
import Icon from '@/components/ui/Icon'

export default function LibraryToolbar({ filteredCount, folders = [] }) {
  const { state, set } = useApp()

  const fObj = state.libFolder && state.libFolder !== '__uncategorized__'
    ? folders.find(f => f.id === state.libFolder)
    : null
  const fLabel = fObj
    ? fObj.name
    : state.libFolder === '__uncategorized__'
      ? 'Uncategorized'
      : 'All Videos'

  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 9, padding: '8px 13px' }}>
        <span style={{ color: 'var(--t3)', fontSize: 13 }}>🔍</span>
        <input
          placeholder="Search videos..."
          value={state.libSearch || ''}
          onChange={e => set({ libSearch: e.target.value })}
          style={{ border: 'none', background: 'transparent', fontSize: 13, color: 'var(--t1)', width: '100%', outline: 'none' }}
        />
      </div>

      {/* Title + filter tabs + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
          {fObj && <span style={{ color: fObj.color }}>● </span>}
          {fLabel}
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--t3)', marginLeft: 8 }}>
            {filteredCount} videos
          </span>
        </div>

        {['all', 'published', 'draft'].map(f => {
          const act    = state.libFilter === f
          const labels = { all: 'All', published: 'Published', draft: 'Draft' }
          return (
            <button
              key={f}
              onClick={() => set({ libFilter: f })}
              style={{ padding: '5px 13px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: act ? 'var(--acc)' : 'var(--s3)', color: act ? '#fff' : 'var(--t2)', border: `1px solid ${act ? 'transparent' : 'var(--b2)'}` }}
            >
              {labels[f]}
            </button>
          )
        })}

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {['grid', 'list'].map(v => {
            const act = state.libView === v
            return (
              <button
                key={v}
                onClick={() => set({ libView: v })}
                style={{ width: 30, height: 30, borderRadius: 7, background: act ? 'var(--s2)' : 'transparent', border: `1px solid ${act ? 'var(--b2)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name={v} size={13} color={act ? 'var(--t1)' : 'var(--t3)'} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
