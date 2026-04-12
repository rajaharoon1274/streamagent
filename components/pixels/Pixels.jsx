'use client'
import { useState, useEffect } from 'react'
import ToggleSwitch from '../ui/ToggleSwitch'

const EVENTS = [
  { name: 'VideoStart', desc: 'Viewer presses play', color: '#4F6EF7' },
  { name: 'VideoPause', desc: 'Viewer pauses', color: '#7B87A0' },
  { name: 'VideoWatch25', desc: '25% watch depth', color: '#06B6D4' },
  { name: 'VideoWatch50', desc: '50% watch depth', color: '#1ED8A0' },
  { name: 'VideoWatch75', desc: '75% watch depth', color: '#F5A623' },
  { name: 'VideoWatch95', desc: '95% watch depth', color: '#FF6B6B' },
  { name: 'GatePassed', desc: 'Viewer passes a lead gate', color: '#06B6D4' },
  { name: 'Lead', desc: 'Email or info submitted', color: '#F06292' },
  { name: 'BranchSelected', desc: 'Branch taken in StreamRoute', color: '#A855F7' },
]

const PIXELS = [
  {
    key: 'meta_pixel_id',
    name: 'Meta Pixel',
    desc: 'Retarget viewers on Facebook & Instagram',
    color: '#1877F2',
    placeholder: '123456789012345',
    help: 'Find in Meta Events Manager → Data Sources → Your Pixel → Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: 'tiktok_pixel_id',
    name: 'TikTok Pixel',
    desc: 'Fire watch & conversion events to TikTok Ads',
    color: '#EE1D52',
    placeholder: 'ABCDEF1234567890',
    help: 'Find in TikTok Ads Manager → Assets → Events → Web Events',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#EE1D52">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.03-.09z" />
      </svg>
    ),
  },
  {
    key: 'google_ads_id',
    name: 'Google Ads',
    desc: 'Fire conversion events for Smart Bidding & PMAX',
    color: '#4285F4',
    placeholder: 'AW-XXXXXXXXX',
    help: 'Find in Google Ads → Goals → Conversions → Tag setup',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    key: 'linkedin_partner_id',
    name: 'LinkedIn Insight Tag',
    desc: 'Retarget and convert B2B audiences on LinkedIn',
    color: '#0A66C2',
    placeholder: '1234567',
    help: 'Find in LinkedIn Campaign Manager → Analyze → Insight Tag',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
]

export default function Pixels() {
  const [pixelValues, setPixelValues] = useState({})
  const [savedValues, setSavedValues] = useState({})
  const [leadValue, setLeadValue] = useState('')
  const [cpTracking, setCpTracking] = useState(true)
  const [enhancedConv, setEnhancedConv] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [toast, setToast] = useState(null)

  // ── Load pixel IDs from workspace on mount ──────────────────────────────────
  useEffect(() => {
    fetch('/api/account')
      .then(r => r.json())
      .then(d => {
        if (d.workspace) {
          const ws = d.workspace
          const vals = {
            meta_pixel_id: ws.meta_pixel_id || '',
            tiktok_pixel_id: ws.tiktok_pixel_id || '',
            google_ads_id: ws.google_ads_id || '',
            linkedin_partner_id: ws.linkedin_partner_id || '',
          }
          setPixelValues(vals)
          setSavedValues(vals)
          setLeadValue(ws.cv_lead?.toString() || '')
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Save individual pixel ID ────────────────────────────────────────────────
  async function handleSave(pixelKey) {
    setSaving(s => ({ ...s, [pixelKey]: true }))
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [pixelKey]: pixelValues[pixelKey] || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSavedValues(s => ({ ...s, [pixelKey]: pixelValues[pixelKey] }))
      showToast(`${PIXELS.find(p => p.key === pixelKey)?.name} saved!`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(s => ({ ...s, [pixelKey]: false }))
    }
  }

  // ── Save lead value ─────────────────────────────────────────────────────────
  async function handleSaveLeadValue() {
    setSaving(s => ({ ...s, lead: true }))
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_lead: parseFloat(leadValue) || 0 }),
      })
      if (!res.ok) throw new Error('Save failed')
      showToast('Lead value saved!')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(s => ({ ...s, lead: false }))
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 24px', color: 'var(--t3)', fontSize: 13, textAlign: 'center' }}>
        Loading pixel settings…
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 900, animation: 'fadeIn 0.18s ease', position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#FF4444' : '#1ED8A0',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.type === 'error' ? '✗ ' : '✓ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
        Tracking Pixels
      </div>
      <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 22 }}>
        Paste your pixel IDs once. StreamAgent automatically fires conversion events on every video, StreamRoute, and landing page.
      </div>

      {/* Info banner */}
      <div style={{ background: 'rgba(79,110,247,0.06)', border: '1px solid rgba(79,110,247,0.2)', borderRadius: 14, padding: '16px 18px', marginBottom: 22, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>9 Data Points Fired Automatically</div>
          <div style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.6 }}>
            StreamAgent fires <strong style={{ color: 'var(--t1)' }}>VideoStart, VideoPause, VideoWatch25, VideoWatch50, VideoWatch75, VideoWatch95, GatePassed, Lead,</strong> and <strong style={{ color: 'var(--t1)' }}>BranchSelected</strong> events on every video — across all connected ad platforms.
          </div>
        </div>
      </div>

      {/* Pixel cards */}
      {PIXELS.map(pixel => {
        const val = pixelValues[pixel.key] || ''
        const savedVal = savedValues[pixel.key] || ''
        const isConnected = savedVal.length > 4
        const isDirty = val !== savedVal
        const isSaving = saving[pixel.key]

        return (
          <div key={pixel.key} style={{
            background: 'var(--s2)',
            border: `1px solid ${isConnected ? pixel.color + '44' : 'var(--b2)'}`,
            borderRadius: 14, padding: '18px 20px', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${pixel.color}15`, border: `1px solid ${pixel.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pixel.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>{pixel.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{pixel.desc}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: isConnected ? 'rgba(30,216,160,0.1)' : 'var(--s3)', color: isConnected ? 'var(--grn)' : 'var(--t3)' }}>
                {isConnected ? '● Connected' : 'Not connected'}
              </div>
            </div>

            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6, display: 'block' }}>
              Pixel ID
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input
                className="prop-inp"
                style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11, marginBottom: 0 }}
                value={val}
                onChange={e => setPixelValues(p => ({ ...p, [pixel.key]: e.target.value }))}
                placeholder={pixel.placeholder}
              />
              <button
                onClick={() => handleSave(pixel.key)}
                disabled={isSaving || !isDirty && !val}
                style={{
                  padding: '8px 16px', borderRadius: 9,
                  background: isSaving ? '#444' : isDirty ? pixel.color : '#1ED8A0',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap', minWidth: 60, transition: 'background 0.2s',
                  opacity: (!isDirty && !val) ? 0.5 : 1,
                }}
              >
                {isSaving ? '…' : isDirty ? 'Save' : 'Saved ✓'}
              </button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.5 }}>💡 {pixel.help}</div>
          </div>
        )
      })}

      {/* Events grid */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px', marginTop: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>
          Events Fired Automatically on Every Video
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {EVENTS.map(ev => (
            <div key={ev.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b1)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
              <div>
                <code style={{ fontSize: 10, color: ev.color, fontFamily: 'var(--mono)' }}>{ev.name}</code>
                <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 1 }}>{ev.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Value */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#1ED8A015', border: '1px solid #1ED8A028', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💰</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>Lead Value</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Assign a dollar value to each captured lead so ad platforms can optimize for revenue.</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 140 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>$</span>
            <input
              type="number" min="0" placeholder="e.g. 25"
              value={leadValue}
              onChange={e => setLeadValue(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 24px', borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 13, fontWeight: 600 }}
            />
          </div>
          <button
            onClick={handleSaveLeadValue}
            disabled={saving.lead}
            style={{ padding: '8px 16px', borderRadius: 9, background: saving.lead ? '#444' : '#1ED8A0', color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            {saving.lead ? '…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Choice Point Parameters */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#A855F715', border: '1px solid #A855F728', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔀</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>Choice Point Parameters</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Send the actual choice label with each <code style={{ fontSize: 10, color: '#A855F7', background: '#A855F718', padding: '1px 6px', borderRadius: 4 }}>BranchSelected</code> event</div>
            </div>
          </div>
          <ToggleSwitch value={cpTracking} onChange={setCpTracking} />
        </div>
        <div style={{ background: 'var(--s3)', borderRadius: 10, padding: '12px 14px' }}>
          {[
            ['content_name', 'Video title'],
            ['choice_label', 'The option they picked e.g. "More Leads"'],
            ['choice_position', 'Which button (1, 2, or 3)'],
            ['watch_pct', 'Watch depth when they chose'],
          ].map(p => (
            <div key={p[0]} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <code style={{ fontSize: 10, color: '#A855F7', background: '#A855F718', padding: '2px 8px', borderRadius: 5, fontFamily: 'var(--mono)' }}>{p[0]}</code>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{p[1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Conversions */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F5A62315', border: '1px solid #F5A62328', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔬</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>Enhanced Conversions</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Hash and send lead email with conversion events for better ad platform matching.</div>
            </div>
          </div>
          <ToggleSwitch value={enhancedConv} onChange={setEnhancedConv} />
        </div>
      </div>

    </div>
  )
}