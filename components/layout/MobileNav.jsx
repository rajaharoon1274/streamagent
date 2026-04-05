'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import Icon from '@/components/ui/Icon'
import { LogoSvg } from '@/components/ui/Logo'

// Same mapping as Sidebar — "automations" id maps to /integrations URL
const PAGE_URLS = { automations: '/integrations' }
const toUrl = (id) => PAGE_URLS[id] || `/${id}`

const MOBILE_TABS = [
  { id: 'dashboard', icon: 'home', label: 'Home' },
  { id: 'library', icon: 'video', label: 'Videos' },
  { id: 'builder', icon: 'branch', label: 'Routes' },
  { id: 'leads', icon: 'mail', label: 'Leads' },
  { id: '_more', icon: 'menu', label: 'More' },
]

// Full nav items shown in the "More" drawer (matches Sidebar)
const DRAWER_ITEMS = [
  { id: 'dashboard',   icon: 'home',     label: 'Dashboard' },
  { id: 'library',     icon: 'video',    label: 'Video Library' },
  { id: 'analytics',   icon: 'chart',    label: 'Analytics' },
  null,
  { id: 'builder',     icon: 'branch',   label: 'Route Builder' },
  { id: 'leads',       icon: 'mail',     label: 'Leads CRM' },
  null,
  { id: 'automations', icon: 'zap',      label: 'Integrations' },
  { id: 'pixels',      icon: 'eye',      label: 'Tracking Pixels' },
  null,
  { id: 'settings',    icon: 'settings', label: 'Settings' },
]

export default function MobileNav() {
  const router = useRouter()
  const { state, goto } = useApp()
  const [drawerOpen, setDrawerOpen] = useState(false)

  function navigate(id) {
    router.push(toUrl(id))
    goto(id)
  }

  return (
    <>
      <nav className="sa-mobile-nav" style={{ alignItems: 'center', justifyContent: 'space-around', padding: '0 4px' }}>
        {MOBILE_TABS.map(item => {
          const isMore = item.id === '_more'
          const active = !isMore && state.page === item.id
          return (
            <button
              key={item.id}
              onClick={() => isMore ? setDrawerOpen(true) : navigate(item.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', minWidth: 48 }}
            >
              <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: active ? 'rgba(79,110,247,0.15)' : 'transparent', transition: 'background 0.15s' }}>
                {isMore ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                ) : (
                  <Icon name={item.icon} size={14} color={active ? 'var(--acc)' : 'var(--t3)'} />
                )}
              </div>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? 'var(--acc)' : 'var(--t3)', letterSpacing: '0.2px' }}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <>
          {/* Backdrop — tap to close */}
          <div
            className="sa-mobile-overlay"
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          />
          {/* Drawer panel */}
          <div
            className="sa-mobile-drawer"
            style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 999, background: 'var(--s1)', borderRight: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 34, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogoSvg size={28} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--t1)' }}>StreamAgent</div>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 18, cursor: 'pointer', padding: 4 }}>✕</button>
            </div>
            {/* Nav items */}
            <nav style={{ padding: '8px 10px', flex: 1, overflowY: 'auto' }}>
              {DRAWER_ITEMS.map((item, i) => {
                if (!item) return <div key={i} style={{ height: 1, background: 'var(--b1)', margin: '6px 4px' }} />
                const active = state.page === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => { navigate(item.id); setDrawerOpen(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                      padding: '9px 11px', borderRadius: 9, border: 'none',
                      background: active ? 'rgba(79,110,247,0.1)' : 'transparent',
                      color: active ? 'var(--acc)' : 'var(--t2)',
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                    }}
                  >
                    <Icon name={item.icon} size={15} color={active ? 'var(--acc)' : 'var(--t3)'} />
                    {item.label}
                  </button>
                )
              })}
            </nav>

            {/* Profile section */}
            <div style={{ borderTop: '1px solid var(--b1)', padding: '12px 10px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, padding: '6px 8px' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#06B6D4,#4F6EF7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0
                }}>
                  JD
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>John Doe</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>Core Plan · $49/mo</div>
                </div>
              </div>

              <button
                onClick={() => { navigate('settings'); setDrawerOpen(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 8, border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 11, color: 'var(--t2)', textAlign: 'left', marginBottom: 4
                }}
                onMouseDown={e => e.currentTarget.style.background = 'var(--s3)'}
                onMouseUp={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13 }}>⚙️</span>
                Account Settings
              </button>

              <button
                onClick={() => { router.push('/login'); setDrawerOpen(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 8, border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 11, color: 'var(--red)', textAlign: 'left'
                }}
                onMouseDown={e => e.currentTarget.style.background = 'rgba(255,107,107,0.06)'}
                onMouseUp={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13 }}>🚪</span>
                Log Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
