'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import VideoPlayer from '@/components/ui/VideoPlayer'
import WorkspaceSidebar from './WorkspaceSidebar'
import WorkspaceTabs from './WorkspaceTabs'
import OverviewTab from './overview/OverviewTab'
import SettingsTab from './settings/SettingsTab'
import BrandingTab from './branding/BrandingTab'
import LandingTab from './landing/LandingTab'
import ShareTab from './share/ShareTab'
import ElementsEditor from './elements/ElementsEditor'

// ── Branding defaults ────────────────────────────────────────────────────────
// Shared between VideoWorkspace (state init) and WorkspaceSidebar (save payload)
export const BRANDING_DEFAULTS = {
  // Colors
  color: '#4F6EF7',
  secondaryColor: '#1ED8A0',
  textColor: '#ffffff',
  // Play button
  playBtnShape: 'circle',
  playBtnSize: 'medium',
  playBtnColor: '',
  playBtnBorder: false,
  playBtnPulse: true,
  // Control bar
  barStyle: 'pill',
  barBg: 'rgba(0,0,0,0.6)',
  barOpacity: 0.85,
  barIconColor: '#ffffff',
  scrubberColor: '',
  scrubberStyle: 'thin',
  // Controls visibility (Day 13)
  showProgress: true,
  showTime: true,
  showShareButton: true,
  showVolume: true,
  showSettings: true,
  showSpeed: true,
  showQuality: true,
  showFullscreen: true,
  showPlaybar: true,
  bigPlayBtn: true,
  smallPlayBtn: true,
  // Player mode — 8 styles (Day 13)
  playerMode: 'frosted-pill',
  // Shape
  cornerRadius: 12,
  borderEnabled: false,
  borderColor: 'rgba(255,255,255,0.1)',
  ambientGlow: false,
  ambientIntensity: 0.4,
  // Logo
  logoUrl: '',
  logoPosition: 'top-left',
  logoSize: 'small',
  logoOpacity: 0.8,
  logoClickUrl: '',
  // Thumbnail
  thumbnailUrl: '',
  thumbnailStyle: 0,
  font: 'Outfit',
  // Behavior
  autoplay: false,
  muted: false,         // Day 13 — autoplay enforces this true
  loop: false,
  mutedStart: false,
  controls: true,
  autoplayMode: 'off',
  endAction: 'pause-last',
  resumePlayback: false,
  silentPreviewDuration: 10,
  silentPreviewBadge: true,
  silentBadgePosition: 'top-right',
  // Badge
  badge: true,
  // Captions
  captions: true,
  captionsDefault: false,
  captionStyle: 'classic',     // Day 13
  // Chapters
  chapters: true,
  chapterTitles: true,          // Day 13
  // Other
  ctaReplayPrevention: true,
  autoPersonalize: false,
  keyboardShortcuts: true,
  mobileFF: false,
  useGlobal: false,
}

// ── Landing page defaults ────────────────────────────────────────────────────
export const LP_DEFAULTS = {
  headline: 'Watch This Free Video Training',
  subheadline: '',
  body: 'Enter your info below and get instant access to this exclusive training.',
  ctaText: 'Book a Free Call',
  ctaUrl: '',
  bg: '#0F172A',
  tc: '#EEF2FF',
  brand: '#4F6EF7',
  font: 'Outfit',
  logoText: 'StreamAgent',
  logoUrl: '',
  heroUrl: '',
  showLogo: true,
  showHero: false,
  showHeadline: true,
  showVideo: true,
  showBody: true,
  showCTA: true,
  showComments: false,
  showPowered: true,
  seoTitle: '',
  seoDesc: '',
}

// ── Processing / error state player ─────────────────────────────────────────
function ProcessingPlayer({ status, accentColor }) {
  const isProcessing = status === 'processing'
  const isUploading = status === 'uploading'

  const label = isUploading
    ? 'Uploading…'
    : isProcessing
      ? 'Processing video…'
      : 'Unavailable'

  const sub = isUploading
    ? 'Your video is being uploaded to Cloudflare.'
    : isProcessing
      ? 'Your video is being transcoded. This usually takes a few minutes.'
      : 'This video could not be loaded.'

  return (
    <div
      className="vid-ws-player"
      style={{ background: 'var(--s1)', flexShrink: 0, paddingTop: 20, borderBottom: '1px solid var(--b2)' }}
    >
      <div style={{
        maxWidth: 560, margin: '0 auto', aspectRatio: '16/9',
        background: 'var(--s3)', position: 'relative', borderRadius: 8,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <svg
          width="22" height="22" viewBox="0 0 24 24"
          fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round"
          style={{ animation: 'vw-spin 0.9s linear infinite' }}
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', maxWidth: 280 }}>{sub}</div>
        <style>{`@keyframes vw-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function VideoWorkspace({ video: v }) {
  const router = useRouter()
  const { state, set } = useApp()

  const tab = state.videoDetailTab || 'overview'
  const accentColor = v.branding?.color || v.color || '#4F6EF7'
  const elCount = Array.isArray(v.elements) ? v.elements.length : 0
  const isReady = v.status === 'ready' || !!v.stream_uid
  const isTransient = v.status === 'uploading' || v.status === 'processing'

  // ── Lifted branding state — initialised from DB, edited locally ───────────
  const [brandingData, setBrandingData] = useState(() => ({
    ...BRANDING_DEFAULTS,
    ...(v.branding || {}),
  }))
  const onBrandingChange = (key, val) =>
    setBrandingData(prev => ({ ...prev, [key]: val }))

  // ── Lifted landing page state ─────────────────────────────────────────────
  const [landingData, setLandingData] = useState(() => ({
    ...LP_DEFAULTS,
    ...(v.lp || {}),
  }))
  const onLandingChange = (key, val) =>
    setLandingData(prev => ({ ...prev, [key]: val }))

  const switchTab = (id) => set({ videoDetailTab: id })
  const goBack = () => {
    set({ libSelectedVideo: null, videoDetailTab: 'overview' })
    router.push('/library')
  }

  // Elements tab owns its own DnD context — no sidebar, full layout
  const withPlayer = ['overview']
  const fullLayout = ['elements']

  return (
    <div
      className="vid-ws-wrap"
      style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}
    >

      {/* ── Responsive overrides ── */}
      <style jsx global>{`
        @media (max-width: 1024px) {
          .vid-ws-wrap {
            flex-direction: column !important;
            overflow-y: visible !important;
            height: auto !important;
          }
          .vid-ws-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-top: 1px solid var(--b1) !important;
            border-bottom: none !important;
            order: 2;
            height: auto !important;
          }
          .vid-ws-main {
            order: 1;
            height: auto !important;
          }
          .vid-ws-sidebar-back-section {
            display: none !important;
          }
          .vid-ws-back-btn {
            display: flex !important;
          }
        }
      `}</style>

      {/* ── Left sidebar — hidden only for elements tab ── */}
      {!fullLayout.includes(tab) && (
        <WorkspaceSidebar
          video={v}
          tab={tab}
          accentColor={accentColor}
          onBack={goBack}
          brandingData={brandingData}
          onBrandingChange={onBrandingChange}
          landingData={landingData}
          onLandingChange={onLandingChange}
          onLandingTabSwitch={switchTab}
        />
      )}

      {/* ── Centre / main panel ── */}
      <div
        className="vid-ws-main"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}
      >

        {/* Mobile back button — hidden on desktop via CSS above */}
        <div
          className="vid-ws-back-btn"
          style={{
            display: 'none', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderBottom: '1px solid var(--b1)',
            background: 'var(--s1)', flexShrink: 0,
          }}
        >
          <button
            onClick={goBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--acc)', fontSize: 12, fontWeight: 600,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Back
          </button>
          <span style={{
            fontSize: 12, fontWeight: 700, color: 'var(--t1)',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {v.title}
          </span>
        </div>

        {/* Tab bar */}
        <WorkspaceTabs video={v} tab={tab} elCount={elCount} onSwitch={switchTab} />

        {/* Scrollable content area */}
        <div style={{
          flex: 1,
          overflow: fullLayout.includes(tab) ? 'hidden' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minHeight: 0,
        }}>

          {/* ── Video player — overview tab only ── */}
          {withPlayer.includes(tab) && (
            isTransient
              ? <ProcessingPlayer status={v.status} accentColor={accentColor} />
              : isReady
                ? (
                  <div
                    className="vid-ws-player"
                    style={{ background: 'var(--s1)', flexShrink: 0, paddingTop: 20, borderBottom: '1px solid var(--b2)' }}
                  >
                    {/* Pass live brandingData so overview player reflects current branding state */}
                    <VideoPlayer
                      streamUid={v.stream_uid}
                      aspectRatio={v.aspectRatio || '16:9'}
                      autoplay={brandingData.autoplay}
                      muted={brandingData.muted || brandingData.autoplay}
                      branding={brandingData}
                    />
                  </div>
                )
                : <ProcessingPlayer status="error" accentColor={accentColor} />
          )}

          {/* ── Tab content ── */}
          <div style={{
            flex: 1,
            display: 'block',
            overflow: fullLayout.includes(tab) ? 'hidden' : undefined,
            height: fullLayout.includes(tab) ? '100%' : undefined,
            minHeight: 0,
            padding: fullLayout.includes(tab) ? 0
              : tab === 'overview' ? '28px 20px 20px'
                : 0,
          }}>

            {/* Overview */}
            {tab === 'overview' && (
              <OverviewTab video={v} accentColor={accentColor} onTabSwitch={switchTab} />
            )}

            {/* Elements — full layout, owns its own DnD context */}
            {tab === 'elements' && (
              <ElementsEditor video={v} accentColor={accentColor} onBack={goBack} />
            )}

            {/* Branding — live preview; controls live in WorkspaceSidebar */}
            {tab === 'branding' && (
              <BrandingTab video={v} b={brandingData} aspectRatio={v.aspectRatio} />
            )}

            {/* Landing — live preview; controls live in WorkspaceSidebar */}
            {tab === 'landing' && (
              <LandingTab video={v} lp={landingData} />
            )}

            {/* Settings */}
            {tab === 'settings' && (
              <SettingsTab video={v} />
            )}

            {/* Share */}
            {tab === 'share' && (
              <ShareTab video={v} accentColor={accentColor} onTabSwitch={switchTab} />
            )}

          </div>
        </div>
      </div>
    </div>
  )
}