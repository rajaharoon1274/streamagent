'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useApp } from '@/context/AppContext'

import PlayButtonPanel from './branding/panels/PlayButtonPanel'
import ControlsPanel from './branding/panels/ControlsPanel'
import ColorsPanel from './branding/panels/ColorsPanel'
import ShapePanel from './branding/panels/ShapePanel'
import LogoPanel from './branding/panels/LogoPanel'
import ThumbnailPicker from './branding/panels/ThumbnailPicker'
import BehaviorPanel from './branding/panels/BehaviorPanel'
import CaptionsPanel from './branding/panels/CaptionsPanel'
import ChaptersPanel from './branding/panels/ChaptersPanel'

import AccordionSection from '@/components/ui/AccordionSection'
import ContentCTASection from './landing/controls/ContentCTASection'
import PageSectionsSection from './landing/controls/PageSectionsSection'
import ColorsSection from './landing/controls/ColorsSection'
import SEOSection from './landing/controls/SEOSection'

const BRANDING_SECTIONS = [
  { id: 'play-button', icon: '▶', label: 'Play Button' },
  { id: 'controls', icon: '🎛', label: 'Controls' },
  { id: 'captions', icon: '💬', label: 'Captions' },
  { id: 'chapters', icon: '📖', label: 'Chapters' },
  { id: 'behavior', icon: '⚙', label: 'Behavior' },
  { id: 'colors', icon: '🎨', label: 'Colors' },
  { id: 'shape', icon: '⬜', label: 'Shape' },
  { id: 'logo', icon: '✦', label: 'Logo' },
  { id: 'thumbnail', icon: '🖼', label: 'Thumbnail' },
]

// ── Branding sidebar ──────────────────────────────────────────────────────────
function BrandingSidebarContent({ video: v, b, onChange, accentColor }) {
  const [sub, setSub] = useState('play-button')
  const [saving, setSaving] = useState(false)
  const accent = accentColor || '#4F6EF7'

  async function saveBranding() {
    setSaving(true)
    try {
      const payload = { ...b }
      if (payload.autoplay === true) payload.muted = true
      const res = await fetch(`/api/videos/${v.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branding: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success('Branding saved!')
    } catch (err) {
      toast.error(err.message || 'Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  const panelProps = { b, onChange, videoId: v.id }

  const renderPanel = () => {
    switch (sub) {
      case 'play-button': return <PlayButtonPanel  {...panelProps} />
      case 'controls': return <ControlsPanel    {...panelProps} />
      case 'captions': return <CaptionsPanel    {...panelProps} />
      case 'chapters': return <ChaptersPanel    {...panelProps} />
      case 'behavior': return <BehaviorPanel    {...panelProps} />
      case 'colors': return <ColorsPanel      {...panelProps} />
      case 'shape': return <ShapePanel       {...panelProps} />
      case 'logo': return <LogoPanel        {...panelProps} />
      case 'thumbnail': return <ThumbnailPicker  {...panelProps} />
      default: return null
    }
  }

  return (
    <>
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>Branding</div>
        <div style={{ fontSize: 10, color: 'var(--t3)' }}>Syncs to player &amp; landing page</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, marginBottom: 14 }}>
          {BRANDING_SECTIONS.map(s => {
            const act = sub === s.id
            return (
              <button key={s.id} onClick={() => setSub(s.id)} style={{
                padding: '5px 4px', borderRadius: 7, fontSize: 9, fontWeight: 600,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 2,
                border: `1px solid ${act ? accent : 'var(--b2)'}`,
                background: act ? `${accent}18` : 'var(--s3)',
                color: act ? accent : 'var(--t2)',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 12 }}>{s.icon}</span>
                {s.label}
              </button>
            )
          })}
        </div>
        {renderPanel()}
      </div>

      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--b1)', flexShrink: 0 }}>
        <button
          onClick={saveBranding} disabled={saving}
          style={{
            width: '100%', padding: '8px', borderRadius: 9,
            background: saving ? 'var(--s3)' : accent,
            color: saving ? 'var(--t3)' : '#fff',
            fontSize: 12, fontWeight: 700, border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s',
          }}
        >
          {saving ? 'Saving…' : '💾 Save Branding'}
        </button>
      </div>
    </>
  )
}

// ── Landing sidebar ───────────────────────────────────────────────────────────
//  Added onSlugChange prop — notifies VideoWorkspace when slug is known
function LandingSidebarContent({ video: v, lp, onChange, accentColor, onSlugChange }) {
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [slug, setSlug] = useState(v.slug || null)

  const accent = accentColor || '#4F6EF7'
  const isPublished = v.privacy === 'published' || v.privacy === 'Published'
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const landingUrl = slug ? `${origin}/p/${slug}` : null

  // Fetch slug on mount if not already on video object
  useEffect(() => {
    if (slug) return
    fetch(`/api/videos/${v.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.slug) {
          setSlug(d.slug)
          onSlugChange?.(d.slug)   // ✅ notify parent
        }
      })
      .catch(() => { })
  }, [v.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveLanding() {
    setSaving(true)
    try {
      const res = await fetch(`/api/videos/${v.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      if (data.slug) {
        setSlug(data.slug)
        onSlugChange?.(data.slug)  // ✅ notify parent so ShareTab gets real slug
      }
      toast.success('Landing page saved!')
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function copyUrl() {
    const url = landingUrl || `${origin}/watch/${v.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      {/* Header */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Landing Page</div>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 50,
            background: isPublished ? 'rgba(30,216,160,0.1)' : 'rgba(255,255,255,0.05)',
            color: isPublished ? 'var(--grn)' : 'var(--t3)',
          }}>
            {isPublished ? '● Published' : '● Draft'}
          </span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--t3)' }}>Customize content &amp; layout</div>

        {/* Slug pill */}
        {slug && (
          <div style={{
            marginTop: 7, padding: '4px 8px', borderRadius: 6,
            background: 'var(--s3)', border: '1px solid var(--b2)',
            fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--mono)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            /p/<span style={{ color: 'var(--acc)', fontWeight: 700 }}>{slug}</span>
          </div>
        )}
      </div>

      {/* Accordion sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        <AccordionSection title="Content &amp; CTA" defaultOpen>
          <ContentCTASection lp={lp} onChange={onChange} videoId={v.id} />
        </AccordionSection>
        <AccordionSection title="Page Sections">
          <PageSectionsSection lp={lp} onChange={onChange} />
        </AccordionSection>
        <AccordionSection title="Colors &amp; Background">
          <ColorsSection lp={lp} onChange={onChange} accentColor={accent} />
        </AccordionSection>
        <AccordionSection title="SEO">
          <SEOSection lp={lp} onChange={onChange} video={v} />
        </AccordionSection>
      </div>

      {/* Footer buttons */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
        {/* Open live page — only if published & slug exists */}
        {/* {landingUrl && isPublished && (
          <a
            href={landingUrl} target="_blank" rel="noreferrer"
            style={{
              width: '100%', padding: '6px 0', borderRadius: 8, boxSizing: 'border-box',
              background: 'var(--s3)', border: '1px solid var(--b1)',
              color: 'var(--acc)', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              textDecoration: 'none',
            }}
          >
            🌐 Open Live Page ↗
          </a>
        )} */}

        <button
          onClick={copyUrl}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 8,
            background: 'var(--s3)', border: '1px solid var(--b1)',
            color: 'var(--t2)', fontSize: 11, fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          {copied ? '✓ Copied!' : '🔗 Copy Landing URL'}
        </button>

        <button
          onClick={saveLanding} disabled={saving}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            background: saving ? 'var(--s3)' : accent,
            border: 'none', color: saving ? 'var(--t3)' : '#fff',
            fontSize: 12, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : '💾 Save Landing Page'}
        </button>
      </div>
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
// ✅ Added onSlugChange prop — passed through to LandingSidebarContent
export default function WorkspaceSidebar({
  video: v, tab, accentColor, onBack,
  brandingData, onBrandingChange,
  landingData, onLandingChange,
  onSlugChange,                        // ✅ new prop
}) {
  useApp() // keep context subscription alive

  const vStatus = v.privacy || v.status || 'draft'
  const isPublished = vStatus === 'published' || vStatus === 'Published'
  const isPP = vStatus === 'Password Protected'
  const statusColor = isPublished ? 'var(--grn)' : isPP ? 'var(--amb)' : 'var(--t3)'
  const statusLabel = isPublished ? '● Published' : isPP ? '🔒 Password' : '● Draft'

  const fileRows = [
    ['Resolution', v.resolution || '1920 × 1080'],
    ['File Size', v.fileSize || '—'],
    ['Format', v.format || 'MP4 / H.264'],
    ['Frame Rate', v.fps || '29.97 fps'],
    ['Duration', v.dur || '—'],
    ['Audio', v.audio || 'AAC Stereo'],
    ['Uploaded', v.uploadDate || '—'],
    ['By', v.uploadedBy || 'You'],
  ]

  return (
    <div
      className={tab === 'overview' ? 'vid-ws-sidebar vid-ws-sidebar-overview' : 'vid-ws-sidebar'}
      style={{
        width: 260, background: 'var(--s1)', borderRight: '1px solid var(--b1)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        height: '100%', overflow: 'hidden',
      }}
    >
      {/* Back + mini thumbnail */}
      <div className="vid-ws-sidebar-back-section" style={{ padding: '11px 12px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        <button
          onClick={onBack}
          onMouseOver={e => e.currentTarget.style.background = 'var(--s3)'}
          onMouseOut={e => e.currentTarget.style.background = 'none'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'none',
            border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
            width: '100%', marginBottom: 4, transition: 'background 0.15s',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: 'var(--s3)',
            border: '1px solid var(--b2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </div>
          <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>Back to Library</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 48, height: 30, borderRadius: 6, background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
            <div style={{ position: 'relative' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {v.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>
              <span style={{ color: statusColor }}>{statusLabel}</span> · {v.dur}
            </div>
          </div>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <>
          <div style={{ padding: '10px 12px 6px', flexShrink: 0, borderBottom: '1px solid var(--b1)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Video File</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {fileRows.map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 2px', borderBottom: '1px solid var(--b1)' }}>
                <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--t1)', fontWeight: 600, fontFamily: 'var(--mono)', textAlign: 'right', maxWidth: '60%' }}>{val}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'branding' && (
        <BrandingSidebarContent video={v} b={brandingData} onChange={onBrandingChange} accentColor={accentColor} />
      )}

      {tab === 'landing' && (
        // ✅ onSlugChange passed down so VideoWorkspace slug state stays in sync
        <LandingSidebarContent
          video={v}
          lp={landingData}
          onChange={onLandingChange}
          accentColor={accentColor}
          onSlugChange={onSlugChange}
        />
      )}

      {tab === 'settings' && (
        <>
          <div style={{ padding: '10px 12px 6px', flexShrink: 0, borderBottom: '1px solid var(--b1)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Settings</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', paddingBottom: 10 }}>
              Edit video settings in the panel to the right.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', marginBottom: 6 }}>STATUS</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{statusLabel}</div>
              </div>
              {v.duration && (
                <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', marginBottom: 6 }}>DURATION</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{v.duration}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'share' && (
        <>
          <div style={{ padding: '10px 12px 6px', flexShrink: 0, borderBottom: '1px solid var(--b1)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>Share &amp; Embed</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>Links, embed codes, QR</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>
              Use the panel on the right to copy links, embed codes, and generate QR codes.
            </div>
          </div>
        </>
      )}
    </div>
  )
}