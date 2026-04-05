'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import Icon from '@/components/ui/Icon'

// All page titles matching HTML's buildTopbar() titles object
const PAGE_TITLES = {
  dashboard:    'Dashboard',
  library:      'Video Library',
  analytics:    'Analytics',
  builder:      'Route Builder',
  leads:        'Leads CRM',
  settings:     'Settings',
  upload:       'Upload Video',
  automations:  'Integrations',      // ← HTML uses "automations" as the page id
  integrations: 'Integrations',      // ← alias
  pixels:       'Tracking Pixels',
  qr:           'QR Codes',          // ← added
  'lp-editor':  'Landing Page Editor', // ← added
}

export default function Topbar() {
  const { state, set, goto } = useApp()
  const router = useRouter()
  const pathname = usePathname()
  const { notifOpen, notifications, lightMode } = state
  const unread = (notifications || []).filter(n => n.unread).length

  // Derive current page from URL pathname for accurate title display
  const urlSeg = pathname?.split('/').filter(Boolean)[0]
  const currentPage = urlSeg || state.page || 'dashboard'

  return (
    <div className="sa-topbar">
      {/* Page title */}
      <h1 style={{ fontSize: 17, fontWeight: 800, color: 'var(--t1)', flex: 1, letterSpacing: '-0.3px' }}>
        {PAGE_TITLES[currentPage] || ''}
      </h1>

      {/* Light / dark toggle */}
      <button
        className="hide-mobile"
        onClick={() => set({ lightMode: !lightMode })}
        title={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--s3)', border: '1px solid var(--b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 17, transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--s4)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--s3)'}
      >
        {lightMode ? '🌙' : '☀️'}
      </button>

      {/* Notifications bell */}
      <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div
          onClick={() => set({ notifOpen: !notifOpen })}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: notifOpen ? 'var(--acc)' : 'rgba(79,110,247,0.12)',
            border: `1px solid ${notifOpen ? 'var(--acc)' : 'rgba(79,110,247,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
          }}
        >
          <Icon name="bell" size={14} color={notifOpen ? '#fff' : 'var(--acc)'} />
          {unread > 0 && (
            <div style={{
              position: 'absolute', top: -2, right: -2,
              width: 9, height: 9, borderRadius: '50%',
              background: 'var(--red)', border: '2px solid var(--s1)',
            }} />
          )}
        </div>

        {/* Notifications dropdown */}
        {notifOpen && (
          <div
            className="notif-dropdown"
            style={{
              position: 'absolute', top: 40, right: 0,
              width: 360, background: 'var(--s1)',
              border: '1px solid var(--b2)', borderRadius: 14,
              boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
              zIndex: 100, overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Notifications</div>
              {unread > 0 && (
                <button
                  onClick={() => set({ notifications: notifications.map(n => ({ ...n, unread: false })) })}
                  style={{ fontSize: 9, color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {(notifications || []).map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--b1)',
                    display: 'flex', gap: 10, cursor: 'pointer',
                    background: n.unread ? 'rgba(79,110,247,0.03)' : 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'rgba(79,110,247,0.03)' : 'transparent'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${n.color}15`, border: `1px solid ${n.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {n.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: n.unread ? 700 : 500, color: 'var(--t1)', marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.desc}</div>
                    <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 3 }}>{n.time}</div>
                  </div>
                  {n.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--acc)', flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--b1)', textAlign: 'center' }}>
              <button
                onClick={() => set({ page: 'settings', settingsTab: 'Lead Routing', notifOpen: false })}
                style={{ fontSize: 11, fontWeight: 600, color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Notification Settings →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={() => router.push('/upload')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--acc)', color: '#fff', padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
      >
        <Icon name="plus" size={13} color="#fff" />
        <span className="hide-mobile">Upload Video</span>
      </button>
    </div>
  )
}