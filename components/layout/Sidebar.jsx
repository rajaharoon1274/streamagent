'use client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import Icon from '@/components/ui/Icon'
import { LogoSvg } from '@/components/ui/Logo'

// Map sidebar ids → actual URL paths (only where they differ)
const PAGE_URLS = { automations: '/integrations' }
const toUrl = (id) => PAGE_URLS[id] || `/${id}`

// IMPORTANT: HTML uses "automations" as the page id for Integrations
const NAV_ITEMS = [
  { id: 'dashboard',   icon: 'home',     label: 'Dashboard' },
  { id: 'library',     icon: 'video',    label: 'Video Library' },
  { id: 'analytics',   icon: 'chart',    label: 'Analytics' },
  null,
  { id: 'builder',     icon: 'branch',   label: 'Route Builder', badge: 'NEW' },
  { id: 'leads',       icon: 'mail',     label: 'Leads CRM',     badge: 'NEW' },
  null,
  { id: 'automations', icon: 'zap',      label: 'Integrations' },   // ← "automations" matches HTML
  { id: 'pixels',      icon: 'eye',      label: 'Tracking Pixels' },
  null,
  { id: 'settings',    icon: 'settings', label: 'Settings' },
]

// Active state colors from HTML (line 856–857): #A78BFA (light purple), not var(--acc)
const ACTIVE_COLOR  = '#A78BFA'
const ACTIVE_BG     = 'rgba(79,110,247,0.15)'
const ACTIVE_BORDER = 'rgba(79,110,247,0.3)'

export default function Sidebar() {
  const { state, set, goto, logout } = useApp()
  const router = useRouter()
  const { sidebarCollapsed: collapsed, page, account, profileOpen } = state

  return (
    <div
      className="sa-sidebar"
      style={{ width: collapsed ? 60 : 212 }}
    >
      {/* ── Logo / header ───────────────────────────────────────────────── */}
      <div style={{
        height: 54, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0 10px' : '14px 12px 14px 16px',
        borderBottom: '1px solid var(--b1)',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 4, flexShrink: 0,
      }}>
        {!collapsed && (
          <>
            <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogoSvg size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--t1)', letterSpacing: '-0.3px' }}>StreamAgent</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Interactive Video</div>
            </div>
          </>
        )}

        {/* Collapse / expand toggle */}
        <div
          onClick={() => set({ sidebarCollapsed: !collapsed })}
          style={{
            width: 24, height: 24, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            background: 'var(--s3)', border: '1px solid var(--b2)',
            color: 'var(--t3)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--s4)'; e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.color = 'var(--acc)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--s3)'; e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.color = 'var(--t3)' }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <polyline points="9,18 15,12 9,6" />
              : <polyline points="15,18 9,12 15,6" />
            }
          </svg>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav style={{
        flex: 1, overflowY: 'auto',
        padding: collapsed ? '8px 6px' : '8px 10px',
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        {NAV_ITEMS.map((item, i) => {
          if (!item) return <div key={i} style={{ height: 1, background: 'var(--b1)', margin: '6px 4px' }} />

          const active = page === item.id
          return (
            <button
              key={item.id}
              className="nav-btn"
              onClick={() => {
                if (state.uploadInProgress) {
                  const ok = window.confirm('A video is currently uploading. Are you sure you want to leave?')
                  if (!ok) return
                }
                router.push(toUrl(item.id))
                goto(item.id)
              }}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: collapsed ? '9px 0' : '8px 11px',
                borderRadius: 9,
                marginBottom: 1,
                background: active ? ACTIVE_BG : 'transparent',
                border: `1px solid ${active ? ACTIVE_BORDER : 'transparent'}`,
                color: active ? ACTIVE_COLOR : 'var(--t2)',
                fontSize: 14,
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.12s',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon name={item.icon} size={collapsed ? 16 : 14} color={active ? ACTIVE_COLOR : 'var(--t3)'} />
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && item.badge && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--acc)',
                  background: 'rgba(79,110,247,0.12)',
                  borderRadius: 100, padding: '2px 6px',
                }}>
                  {item.badge}
                </span>
              )}
              {/* Dot badge when collapsed */}
              {collapsed && item.badge && (
                <div style={{
                  position: 'absolute', top: 4, right: 6,
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--acc)',
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Profile section ─────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--b1)', padding: collapsed ? '10px 6px' : '0' }}>
        {collapsed ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar account={account} size={30} onClick={() => set({ profileOpen: !profileOpen })} />
          </div>
        ) : (
          <>
            {/* Profile row + usage bar */}
            <div
              onClick={e => { e.stopPropagation(); set({ profileOpen: !profileOpen }) }}
              style={{ padding: '10px 14px', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                <Avatar account={account} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sa-h3">{account?.firstName} {account?.lastName}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>Core Plan · $49/mo</div>
                </div>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points={profileOpen ? '6,15 12,9 18,15' : '6,9 12,15 18,9'} />
                </svg>
              </div>

              {/* Leads usage bar — matches HTML exactly */}
              <div style={{ marginBottom: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--t3)' }}>Leads</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--t2)' }}>212 / 2,500</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--s4)', overflow: 'hidden' }}>
                  <div style={{ width: '21.2%', height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#06B6D4,#4F6EF7)' }} />
                </div>
              </div>
            </div>

            {/* Profile dropdown */}
            {profileOpen && (
              <div style={{ padding: '0 8px 8px' }} onClick={e => e.stopPropagation()}>
                <ProfileMenuItem
                  icon="📊" label="Plan & Usage"
                  onClick={() => set({ page: 'settings', settingsTab: 'Plan', profileOpen: false })}
                />
                <ProfileMenuItem
                  icon="⚙️" label="Account Settings"
                  onClick={() => set({ page: 'settings', settingsTab: 'Account', profileOpen: false })}
                />
                <div style={{ height: 1, background: 'var(--b1)', margin: '4px 0' }} />
                <div
                  onClick={() => logout()}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 13 }}>🚪</span>
                  <span style={{ fontSize: 11, color: 'var(--red)' }}>Log Out</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ account, size = 30, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg,#06B6D4,#4F6EF7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 800, color: '#fff',
        flexShrink: 0, overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {account?.avatarUrl
        ? <img src={account.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        : `${account?.firstName?.[0] || 'J'}${account?.lastName?.[0] || 'D'}`
      }
    </div>
  )
}

function ProfileMenuItem({ icon, label, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--s3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--t2)' }}>{label}</span>
    </div>
  )
}