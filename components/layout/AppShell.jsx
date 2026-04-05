'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileNav from './MobileNav'

// Pages
import Dashboard    from '@/components/dashboard/Dashboard'
import Library      from '@/components/library/Library'
import Analytics    from '@/components/analytics/Analytics'
import Builder      from '@/components/builder/Builder'
import Leads        from '@/components/leads/Leads'
import Settings     from '@/components/settings/Settings'
import Upload       from '@/components/upload/Upload'
import Integrations from '@/components/integrations/Integrations'
import Pixels       from '@/components/pixels/Pixels'

// These pages don't exist yet — stub components until built
// import QR       from '@/components/qr/QR'
// import LPEditor from '@/components/lp-editor/LPEditor'

// ── Page component map ────────────────────────────────────────────────────────
// IMPORTANT: HTML uses "automations" as the page id for Integrations (not "integrations")
// Both keys map to the same component so old links still work
const PAGE_COMPONENTS = {
  dashboard:   Dashboard,
  library:     Library,
  analytics:   Analytics,
  builder:     Builder,
  leads:       Leads,
  settings:    Settings,
  upload:      Upload,
  automations: Integrations,   // ← HTML uses this id
  integrations:Integrations,   // ← fallback alias
  pixels:      Pixels,
  // Uncomment once built:
  // qr:       QR,
  // 'lp-editor': LPEditor,
}

// Pages that hide the topbar entirely
const NO_TOPBAR = ['elements']

// Pages that need overflow:hidden (canvas-based layouts)
// builder → canvas panning   leads → fixed detail panel
const OVERFLOW_HIDDEN = ['builder', 'leads']

export default function AppShell() {
  const { state, set } = useApp()
  const { lightMode, notifOpen, profileOpen } = state
  const pathname = usePathname()

  // Derive the active page directly from URL on every render — no async, no flash
  const urlSeg = pathname?.split('/').filter(Boolean)[0]
  const activePage = (urlSeg && PAGE_COMPONENTS[urlSeg]) ? urlSeg : (state.page || 'dashboard')

  // Keep state.page in sync so other components reading state.page stay correct
  useEffect(() => {
    if (activePage !== state.page) set({ page: activePage })
  }, [activePage])

  // Apply / remove light-mode class on <body>
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', lightMode)
  }, [lightMode])

  // Close any open dropdown when clicking outside
  useEffect(() => {
    function handleClick() {
      if (notifOpen)    set({ notifOpen: false })
      if (profileOpen)  set({ profileOpen: false })
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [notifOpen, profileOpen])

  const PageComponent = PAGE_COMPONENTS[activePage] || Dashboard
  const showTopbar    = !NO_TOPBAR.includes(activePage)
  const pageOverflow  = OVERFLOW_HIDDEN.includes(activePage) ? 'hidden' : 'auto'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
      <Sidebar />

      <div className="main-content">
        {showTopbar && <Topbar />}
        <div
          className="sa-page-content"
          style={{ overflowY: pageOverflow }}
          onClick={e => e.stopPropagation()}
        >
          <PageComponent />
        </div>
      </div>

      <MobileNav />
    </div>
  )
}