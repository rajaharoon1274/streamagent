'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { TogRow, SectionLabel } from './helpers'

const OPACITY_PRESETS = [
  { l: 'None', v: 0 }, { l: 'Light', v: 30 }, { l: 'Medium', v: 60 }, { l: 'Solid', v: 100 },
]

function fmt(s) {
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0')
}

export default function CaptionsPanel({ b, onChange }) {
  const { state, set } = useApp()
  const [generating, setGenerating] = useState(false)

  const captions = state.aiCaptions || []
  const hlColor = state.aiHighlightColor || '#FFCC00'
  const bgColor = state.aiBarColor || '#000000'
  const opacity = state.aiCaptionOpacity ?? 80

  const generate = () => {
    setGenerating(true)
    setTimeout(() => {
      set({
        aiCaptions: [
          { start: 0, end: 4, text: 'Welcome to this free interactive training.' },
          { start: 4, end: 9, text: "Today we're covering the exact system top agents use." },
          { start: 9, end: 14, text: "You'll discover how to generate leads on autopilot." },
          { start: 14, end: 18, text: 'Even while you sleep.' },
        ],
      })
      setGenerating(false)
    }, 1800)
  }

  const updateCaption = (i, text) => {
    set({ aiCaptions: captions.map((c, ci) => ci === i ? { ...c, text } : c) })
  }

  const removeCaption = (i) => {
    set({ aiCaptions: captions.filter((_, ci) => ci !== i) })
  }

  const addCaption = () => {
    set({ aiCaptions: [...captions, { start: 0, end: 5, text: 'New caption' }] })
  }

  return (
    <>
      {/* ── SECTION 1: Player caption toggles → saves to DB via branding ── */}
      <SectionLabel>Player Caption Controls</SectionLabel>
      <TogRow
        value={b.captions !== false}
        label="Enable Captions"
        desc="Show CC button on the player"
        onChange={v => onChange('captions', v)}
      />
      {b.captions !== false && (
        <TogRow
          value={b.captionsDefault === true}
          label="Captions On by Default"
          desc="Auto-enabled without clicking CC"
          onChange={v => onChange('captionsDefault', v)}
        />
      )}

      <div style={{ height: 12 }} />

      {/* ── SECTION 2: Caption style → saves to DB via branding ── */}
      <SectionLabel>Caption Style</SectionLabel>
      {[
        { id: 'classic', label: 'Classic', desc: 'Bottom bar, solid background' },
        { id: 'modern', label: 'Modern', desc: 'Clean sans-serif, no bg' },
        { id: 'minimal', label: 'Minimal', desc: 'Subtle, small, lower opacity' },
        { id: 'hormozi', label: 'Hormozi', desc: 'Bold word-by-word highlight' },
      ].map(st => {
        const act = (b.captionStyle || 'classic') === st.id
        return (
          <div
            key={st.id}
            onClick={() => onChange('captionStyle', st.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8, marginBottom: 4,
              cursor: 'pointer',
              border: `1px solid ${act ? 'var(--acc)' : 'var(--b2)'}`,
              background: act ? 'rgba(79,110,247,0.08)' : 'var(--s3)',
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${act ? 'var(--acc)' : 'var(--b2)'}`,
              background: act ? 'var(--acc)' : 'transparent',
            }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: act ? 700 : 500, color: act ? 'var(--acc)' : 'var(--t1)' }}>
                {st.label}
              </div>
              <div style={{ fontSize: 9, color: 'var(--t3)' }}>{st.desc}</div>
            </div>
          </div>
        )
      })}

      {/* ── Divider ── */}
      <div style={{ margin: '14px 0 10px', borderTop: '1px solid var(--b1)' }} />
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
        ✨ AI Caption Generator
      </div>

      {/* ── SECTION 3: AI Caption generator → saves to useApp global state ── */}
      {captions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>No AI Captions Yet</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.5 }}>
            AI will transcribe your video and generate styled captions automatically.
          </div>
          <button
            onClick={generate}
            disabled={generating}
            style={{
              width: '100%', padding: 10, borderRadius: 10,
              background: 'linear-gradient(135deg,var(--acc),#A855F7)',
              color: '#fff', fontSize: 12, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              opacity: generating ? 0.7 : 1,
            }}
          >
            {generating ? '⏳ Generating…' : '✨ Generate Captions'}
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--grn)' }}>✓ {captions.length} Captions</div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            <button
              onClick={generate}
              style={{ flex: 1, padding: '6px 4px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
            >
              ↻ Regenerate
            </button>
            <button
              onClick={() => {
                const content = captions
                  .map((c, i) => `${i + 1}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}`)
                  .join('\n\n')
                const a = document.createElement('a')
                a.href = 'data:text/plain,' + encodeURIComponent(content)
                a.download = 'captions.srt'
                a.click()
              }}
              style={{ flex: 1, padding: '6px 4px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
            >
              ⬇ Download .SRT
            </button>
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 10 }}>
            {captions.map((cap, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 5 }}>
                <span style={{ fontSize: 9, color: 'var(--acc)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', paddingTop: 6, minWidth: 30 }}>
                  {fmt(cap.start)}
                </span>
                <input
                  value={cap.text}
                  onChange={e => updateCaption(i, e.target.value)}
                  style={{ flex: 1, fontSize: 10, padding: '4px 7px', background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 6, color: 'var(--t1)', outline: 'none' }}
                />
                <button
                  onClick={() => removeCaption(i)}
                  style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 4, background: 'none', border: '1px solid var(--b2)', color: '#FF6B6B', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addCaption}
            style={{ width: '100%', padding: 6, borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}
          >
            + Add Caption
          </button>
        </>
      )}

      {/* ── SECTION 4: Caption Colors (AI overlay styling) ── */}
      <div style={{ height: 6 }} />
      <SectionLabel>Caption Colors</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>Highlight</span>
        <input
          type="color" value={hlColor}
          onChange={e => set({ aiHighlightColor: e.target.value })}
          style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid var(--b2)', padding: 2, background: 'var(--s3)', cursor: 'pointer' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>Background</span>
        <input
          type="color" value={bgColor}
          onChange={e => set({ aiBarColor: e.target.value })}
          style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid var(--b2)', padding: 2, background: 'var(--s3)', cursor: 'pointer' }}
        />
      </div>

      {/* ── SECTION 5: BG Opacity ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>BG Opacity</span>
        <span style={{ fontSize: 10, color: 'var(--t3)' }}>{opacity}%</span>
      </div>
      <input
        type="range" min={0} max={100} step={5} value={opacity}
        onChange={e => set({ aiCaptionOpacity: parseInt(e.target.value) })}
        style={{ width: '100%', accentColor: 'var(--acc)', marginBottom: 6 }}
      />
      <div style={{ display: 'flex', gap: 4 }}>
        {OPACITY_PRESETS.map(p => {
          const act = opacity === p.v
          return (
            <button
              key={p.v}
              onClick={() => set({ aiCaptionOpacity: p.v })}
              style={{
                flex: 1, padding: 4, borderRadius: 5, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${act ? 'var(--acc)' : 'var(--b2)'}`,
                background: act ? 'rgba(79,110,247,0.1)' : 'var(--s3)',
                color: act ? 'var(--acc)' : 'var(--t2)',
              }}
            >
              {p.l}
            </button>
          )
        })}
      </div>
    </>
  )
}