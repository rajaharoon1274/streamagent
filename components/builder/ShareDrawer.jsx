'use client'
import { useState } from 'react'

// ═══════════════════════════════════════════════════════════════════════════════
// SHARE DRAWER - Complete implementation with Landing Page editor
// ═══════════════════════════════════════════════════════════════════════════════
export default function ShareDrawer({ slug, routeName, routeId, nodes, landingPage: initialLP, onEditLP, onClose }) {
  const [embedTab, setEmbedTab] = useState('js')
  const [lpEditing, setLpEditing] = useState(false)
  const [landingPage, setLandingPage] = useState(initialLP || null)
  
  const baseUrl = `https://streamagent.com/r/${slug}`
  const iframeCode = `<iframe src="${baseUrl}" width="100%" height="560" frameborder="0" allow="autoplay"></iframe>`
  const jsSnippet = `<div id="sa-${slug}"></div>\n<script src="https://streamagent.com/embed.js"\n  data-route="${slug}"\n  data-target="sa-${slug}"></script>`

  function doCopy(text) {
    navigator.clipboard?.writeText(text)
  }

  function createLandingPage() {
    const newLP = {
      status: 'draft',
      headline: 'Watch This Free Video Training',
      body: 'Enter your email and hit play to access this free interactive training.',
      ctaText: 'Book a Free Call',
      ctaUrl: '',
      brandColor: nodes?.[0]?.color || '#4F6EF7',
      logoText: 'StreamAgent',
      vis: { logo: true, headline: true, body: true, cta: true, powered: true }
    }
    setLandingPage(newLP)
    setLpEditing(true)
  }

  function updateLP(key, value) {
    setLandingPage(prev => ({ ...prev, [key]: value }))
  }

  function toggleVis(key) {
    setLandingPage(prev => ({
      ...prev,
      vis: { ...prev.vis, [key]: !prev.vis[key] }
    }))
  }

  function toggleStatus() {
    setLandingPage(prev => ({
      ...prev,
      status: prev.status === 'published' ? 'draft' : 'published'
    }))
  }

  const isLive = landingPage && landingPage.status === 'published'

  return (
    <div style={{
      position: 'absolute',
      top: 48,
      right: 0,
      width: 340,
      height: 'calc(100% - 48px)',
      background: 'var(--s1)',
      borderLeft: '1px solid var(--b1)',
      zIndex: 20,
      overflowY: 'auto',
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>Share StreamRoute</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{routeName || 'Untitled Route'}</div>
        </div>
        <button onClick={onClose}
          style={{ background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          ✕
        </button>
      </div>

      {/* Share Link */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#4F6EF718', border: '1px solid #4F6EF728', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4F6EF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Share Link</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>Send directly to prospects</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 7, padding: '7px 10px', fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {baseUrl}
          </div>
          <button onClick={() => doCopy(baseUrl)}
            style={{ padding: '7px 12px', background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Copy
          </button>
        </div>
      </div>

      {/* Embed Code */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#A855F718', border: '1px solid #A855F728', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Embed Code</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>Two options — JS snippet recommended</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'var(--s3)', borderRadius: 8, padding: 3 }}>
          <button onClick={() => setEmbedTab('js')}
            style={{
              flex: 1,
              padding: 5,
              borderRadius: 6,
              border: 'none',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              background: embedTab === 'js' ? 'var(--s2)' : 'transparent',
              color: embedTab === 'js' ? 'var(--t1)' : 'var(--t3)',
              fontFamily: 'inherit',
            }}>
            JS Snippet ✦
          </button>
          <button onClick={() => setEmbedTab('iframe')}
            style={{
              flex: 1,
              padding: 5,
              borderRadius: 6,
              border: 'none',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              background: embedTab === 'iframe' ? 'var(--s2)' : 'transparent',
              color: embedTab === 'iframe' ? 'var(--t1)' : 'var(--t3)',
              fontFamily: 'inherit',
            }}>
            iFrame
          </button>
        </div>

        {/* Code Display */}
        {embedTab === 'iframe' ? (
          <>
            <div style={{ background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 7, padding: 10, fontSize: 10, color: 'var(--t2)', fontFamily: 'var(--mono)', lineHeight: 1.6, marginBottom: 8 }}>
              {iframeCode}
            </div>
            <button onClick={() => doCopy(iframeCode)}
              style={{ width: '100%', padding: 7, background: 'var(--s3)', color: 'var(--t2)', border: '1px solid var(--b2)', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Copy iFrame
            </button>
          </>
        ) : (
          <>
            <div style={{ background: 'var(--s3)', border: '1px solid rgba(79,110,247,0.2)', borderRadius: 7, padding: 10, fontSize: 10, color: 'var(--t2)', fontFamily: 'var(--mono)', lineHeight: 1.8, marginBottom: 6 }}>
              {jsSnippet}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 8, lineHeight: 1.5 }}>
              Renders inline with your page styling. No iframe borders. Supports lead capture passthrough.
            </div>
            <button onClick={() => doCopy(jsSnippet)}
              style={{ width: '100%', padding: 7, background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Copy JS Snippet
            </button>
          </>
        )}
      </div>

      {/* QR Code */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1ED8A018', border: '1px solid #1ED8A028', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1ED8A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>QR Code</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>For print, events & trade shows</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ width: 100, height: 100, background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--t3)' }}>
            QR Preview
          </div>
        </div>
        <button
          style={{ width: '100%', padding: 7, background: 'var(--s3)', color: 'var(--t2)', border: '1px solid var(--b2)', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ↓ Download QR
        </button>
      </div>

      {/* Landing Page */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F5A62318', border: '1px solid #F5A62328', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Landing Page</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>A hosted page built around this StreamRoute</div>
          </div>
        </div>

        {!landingPage ? (
          <div style={{ textAlign: 'center', padding: '18px 12px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🖼</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>No landing page yet</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.5 }}>
              Create a hosted page that wraps this StreamRoute — headline, branding, and a shareable URL.
            </div>
            <button onClick={createLandingPage}
              style={{ width: '100%', padding: 9, background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Create Landing Page
            </button>
          </div>
        ) : !lpEditing ? (
          <>
            <div style={{ background: 'var(--s3)', border: '1px solid var(--b1)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: isLive ? '#1ED8A0' : '#F5A623' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)' }}>{isLive ? 'Published' : 'Draft'}</div>
                <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)' }}>streamagent.com/r/{slug}</div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {landingPage.headline || ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button onClick={() => setLpEditing(true)}
                style={{ flex: 1, padding: 8, background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--t1)', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✎ Edit Page
              </button>
              <button onClick={() => window.open(baseUrl)}
                style={{ flex: 1, padding: 8, background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--t1)', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                🔗 Preview
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => doCopy(baseUrl)}
                style={{ flex: 1, padding: 7, background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Copy URL
              </button>
              <button onClick={toggleStatus}
                style={{
                  flex: 1,
                  padding: 7,
                  background: isLive ? 'var(--s2)' : '#1ED8A0',
                  border: isLive ? '1px solid #FF6B6B44' : 'none',
                  color: isLive ? '#FF6B6B' : '#000',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: isLive ? 600 : 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                {isLive ? 'Unpublish' : '▶ Publish'}
              </button>
            </div>
          </>
        ) : (
          /* Landing Page Editor */
          <div style={{ marginTop: 8 }}>
            {/* Visibility Toggles */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>Show/Hide Sections</div>
              {['logo', 'headline', 'body', 'cta', 'powered'].map(key => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--t1)', textTransform: 'capitalize' }}>{key === 'cta' ? 'CTA Button' : key === 'powered' ? '"Powered by"' : key}</span>
                  <div className={`toggle-sw ${landingPage.vis[key] !== false ? 'on' : 'off'}`} onClick={() => toggleVis(key)}>
                    <div className="knob"/>
                  </div>
                </div>
              ))}
            </div>

            {/* Logo Text */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Logo Text</label>
              <input value={landingPage.logoText || ''} onChange={e => updateLP('logoText', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}/>
            </div>

            {/* Brand Color */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>Brand Color</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['#4F6EF7', '#1ED8A0', '#F5A623', '#F06292', '#A855F7', '#FF6B6B'].map(c => (
                  <div key={c} onClick={() => updateLP('brandColor', c)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: `2px solid ${landingPage.brandColor === c ? '#fff' : 'transparent'}`, boxShadow: landingPage.brandColor === c ? `0 0 8px ${c}` : 'none', transition: 'all .15s' }}/>
                ))}
              </div>
            </div>

            {/* Headline */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Headline</label>
              <textarea value={landingPage.headline || ''} onChange={e => updateLP('headline', e.target.value)} rows={2}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 12, boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}/>
            </div>

            {/* Body */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Body Text</label>
              <textarea value={landingPage.body || ''} onChange={e => updateLP('body', e.target.value)} rows={3}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 12, boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}/>
            </div>

            {/* CTA */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>CTA Button Text</label>
              <input value={landingPage.ctaText || ''} onChange={e => updateLP('ctaText', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', marginBottom: 6 }}/>
              <input value={landingPage.ctaUrl || ''} onChange={e => updateLP('ctaUrl', e.target.value)} placeholder="https://..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}/>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: '1px solid var(--b1)' }}>
              <button onClick={() => setLpEditing(false)}
                style={{ flex: 1, padding: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Done
              </button>
              <button onClick={() => window.open(baseUrl)}
                style={{ flex: 1, padding: 8, background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
