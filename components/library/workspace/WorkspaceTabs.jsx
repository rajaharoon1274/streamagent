'use client'
import { useApp } from '@/context/AppContext'

export default function WorkspaceTabs({ video: v, tab, elCount, onSwitch }) {
  const tabs = [
    { id: 'overview', label: 'Overview',                                       icon: '📊' },
    { id: 'elements', label: `Elements${elCount > 0 ? ` (${elCount})` : ''}`, icon: '⚡' },
    { id: 'branding', label: 'Branding',                                       icon: '🎨' },
    { id: 'landing',  label: 'Landing Page',                                   icon: '🌐' },
    { id: 'settings', label: 'Settings',                                       icon: '⚙️' },
  ]

  return (
    <div
      className="vid-ws-tabs"
      style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0, gap: 0, overflowX: 'auto' }}
    >
      {/* Video title */}
      <div
        className="vid-ws-title"
        style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', marginRight: 14, padding: '12px 0', flexShrink: 0, minWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}
      >
        {v.title}
      </div>

      {/* Divider */}
      <div
        className="vid-ws-divider"
        style={{ width: 1, height: 18, background: 'var(--b2)', marginRight: 10, flexShrink: 0 }}
      />

      {/* Tab buttons */}
      {tabs.map(t => {
        const active = tab === t.id
        return (
          <button
            key={t.id}
            onClick={() => onSwitch(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '12px 12px', border: 'none', background: 'none',
              fontSize: 12,
              fontWeight: active ? 700 : 400,
              color: active ? 'var(--t1)' : 'var(--t3)',
              cursor: 'pointer',
              borderBottom: `2px solid ${active ? 'var(--acc)' : 'transparent'}`,
              whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            {t.icon} {t.label}
          </button>
        )
      })}

      <div style={{ flex: 1 }} />

      {/* Share button */}
      <button
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 8, background: 'var(--acc)', border: '1px solid var(--acc)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(79,110,247,0.35)', transition: 'all 0.15s' }}
        onMouseOver={e => { e.currentTarget.style.background = '#3b55e0'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,110,247,0.5)' }}
        onMouseOut={e  => { e.currentTarget.style.background = 'var(--acc)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(79,110,247,0.35)' }}
        onClick={() => onSwitch('share')}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
      </button>
    </div>
  )
}
