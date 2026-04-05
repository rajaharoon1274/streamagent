'use client'
import { useState }       from 'react'
import LandingPagePreview from './LandingPagePreview'

// LandingTab is now preview-only.
// All controls (accordion sections, save, copy URL) live in WorkspaceSidebar (LandingSidebarContent).
// State (lp) is lifted to VideoWorkspace and passed down here.

export default function LandingTab({ video: v, lp }) {
  const [previewMode, setPreviewMode] = useState('desktop')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Preview header */}
      <div style={{
        padding: '10px 18px', borderBottom: '1px solid var(--b1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Live Preview</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>
            Edit content in the left panel
          </div>
        </div>

        {/* Desktop / Mobile toggle */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {['desktop', 'mobile'].map(mode => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              style={{
                padding: '3px 10px', borderRadius: 50, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', border: 'none',
                background: previewMode === mode ? 'var(--s3)' : 'none',
                color: previewMode === mode ? 'var(--t1)' : 'var(--t3)',
              }}
            >
              {mode === 'desktop' ? '🖥 Desktop' : '📱 Mobile'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg0)', padding: '20px 24px' }}>
        <div style={{
          maxWidth: previewMode === 'mobile' ? 390 : 860,
          margin: '0 auto',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          <LandingPagePreview lp={lp} video={v} />
        </div>
      </div>
    </div>
  )
}