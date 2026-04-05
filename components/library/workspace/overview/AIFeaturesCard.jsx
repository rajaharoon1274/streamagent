'use client'
import { useApp } from '@/context/AppContext'

const CAPTION_STYLES = [
  { id: 'hormozi',  label: 'Hormozi', desc: 'Bold center' },
  { id: 'classic',  label: 'Classic', desc: 'Subtitle bar' },
  { id: 'modern',   label: 'Modern',  desc: 'Word-by-word' },
  { id: 'minimal',  label: 'Minimal', desc: 'Clean lower' },
]

const HIGHLIGHT_PRESETS = ['#4F6EF7', '#1ED8A0', '#F5A623', '#FF6B6B', '#A855F7', '#EC4899']
const BAR_PRESETS       = ['#000000', '#1a1a2e', '#0f0f0f', '#18181b', '#0d0d0d', '#111111']

const GRADIENT_BTN = {
  background: 'linear-gradient(135deg,rgba(79,110,247,0.15),rgba(168,85,247,0.10))',
  border: '1px solid rgba(79,110,247,0.3)',
  color: 'var(--acc)',
  borderRadius: 9,
  padding: '10px 0',
  width: '100%',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: 0.2,
}

function fmtT(s) {
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0')
}

export default function AIFeaturesCard({ video: v }) {
  const { state, set } = useApp()

  const tab          = state.videoAITab ?? 'captions'
  const captions     = state.aiCaptions  ?? []
  const chapters     = state.aiChapters  ?? []
  const capStyle     = state.aiCaptionStyle ?? 'hormozi'
  const hlColor      = state.aiHighlightColor ?? '#4F6EF7'
  const barColor     = state.aiBarColor ?? '#000000'
  const barOpacity   = state.aiCaptionOpacity ?? 80

  const hasCaptions  = captions.length > 0
  const hasChapters  = chapters.length > 0

  function genCaptions() {
    set({
      aiCaptions: [
        { id: 1, t: 0,   text: 'Welcome to this video' },
        { id: 2, t: 4,   text: "Here's what we'll cover today" },
        { id: 3, t: 9,   text: "Let's dive right in" },
      ],
    })
  }

  function genChapters() {
    set({
      aiChapters: [
        { id: 1, emoji: '🎬', t: '0:00',  title: 'Introduction' },
        { id: 2, emoji: '📚', t: '0:30',  title: 'Main Content' },
        { id: 3, emoji: '✅', t: '1:15',  title: 'Conclusion' },
      ],
    })
  }

  function removeCap(id)  { set({ aiCaptions:  captions.filter(c => c.id !== id) }) }
  function removeChap(id) { set({ aiChapters: chapters.filter(c => c.id !== id) }) }

  function updateCap(id, text)  { set({ aiCaptions:  captions.map(c => c.id === id ? { ...c, text }  : c) }) }
  function updateChap(id, field, val) { set({ aiChapters: chapters.map(c => c.id === id ? { ...c, [field]: val } : c) }) }

  function addChapter() {
    const newId = Date.now()
    set({ aiChapters: [...chapters, { id: newId, emoji: '📌', t: '0:00', title: '' }] })
  }

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(79,110,247,0.12)', border: '1px solid rgba(79,110,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
          🤖
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>AI Features</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Auto-generate captions and chapters</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: 'var(--s3)', borderRadius: 9, padding: 4 }}>
        {[{ id: 'captions', label: 'Captions', has: hasCaptions }, { id: 'chapters', label: 'Chapters', has: hasChapters }].map(t => (
          <button
            key={t.id}
            onClick={() => set({ videoAITab: t.id })}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: tab === t.id ? 'var(--s1)' : 'transparent',
              color: tab === t.id ? 'var(--t1)' : 'var(--t3)',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {t.label} {t.has && <span style={{ color: '#1ED8A0', marginLeft: 3 }}>✓</span>}
          </button>
        ))}
      </div>

      {/* === Captions Tab === */}
      {tab === 'captions' && !hasCaptions && (
        <button onClick={genCaptions} style={GRADIENT_BTN}>✨ Generate Captions with AI</button>
      )}

      {tab === 'captions' && hasCaptions && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{captions.length} captions</div>
            <button onClick={genCaptions} style={{ fontSize: 11, color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer' }}>↺ Regenerate</button>
          </div>

          {/* Caption list */}
          <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
            {captions.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', minWidth: 30 }}>{fmtT(c.t)}</div>
                <input
                  value={c.text}
                  onChange={e => updateCap(c.id, e.target.value)}
                  style={{ flex: 1, fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s1)', color: 'var(--t1)' }}
                />
                <button onClick={() => removeCap(c.id)} style={{ fontSize: 14, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
            ))}
          </div>

          {/* Caption Style */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>Caption Style</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {CAPTION_STYLES.map(s => (
                <div
                  key={s.id}
                  onClick={() => set({ aiCaptionStyle: s.id })}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: `1px solid ${capStyle === s.id ? 'var(--acc)' : 'var(--b2)'}`,
                    background: capStyle === s.id ? 'rgba(79,110,247,0.08)' : 'var(--s1)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>Colors</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Highlight */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Highlight</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {HIGHLIGHT_PRESETS.map(c => (
                    <div key={c} onClick={() => set({ aiHighlightColor: c })} style={{ width: 22, height: 22, borderRadius: 6, background: c, cursor: 'pointer', border: hlColor === c ? '2px solid var(--t1)' : '2px solid transparent', flexShrink: 0 }} />
                  ))}
                  <input type="color" value={hlColor} onChange={e => set({ aiHighlightColor: e.target.value })} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', padding: 0, cursor: 'pointer' }} />
                </div>
              </div>
              {/* Background */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Background</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {BAR_PRESETS.map(c => (
                    <div key={c} onClick={() => set({ aiBarColor: c })} style={{ width: 22, height: 22, borderRadius: 6, background: c, cursor: 'pointer', border: barColor === c ? '2px solid var(--t1)' : '2px solid var(--b2)', flexShrink: 0 }} />
                  ))}
                  <input type="color" value={barColor} onChange={e => set({ aiBarColor: e.target.value })} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', padding: 0, cursor: 'pointer' }} />
                </div>
              </div>
              {/* BG Opacity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>BG Opacity</div>
                  <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600 }}>{barOpacity}%</div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={barOpacity}
                  onChange={e => set({ aiCaptionOpacity: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--acc)' }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* === Chapters Tab === */}
      {tab === 'chapters' && !hasChapters && (
        <button onClick={genChapters} style={GRADIENT_BTN}>✨ Generate Chapters with AI</button>
      )}

      {tab === 'chapters' && hasChapters && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {chapters.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  value={c.emoji}
                  onChange={e => updateChap(c.id, 'emoji', e.target.value)}
                  style={{ width: 32, fontSize: 14, textAlign: 'center', padding: '4px 2px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s1)', color: 'var(--t1)' }}
                />
                <input
                  value={c.t}
                  onChange={e => updateChap(c.id, 't', e.target.value)}
                  placeholder="0:00"
                  style={{ width: 46, fontSize: 11, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s1)', color: 'var(--t1)' }}
                />
                <input
                  value={c.title}
                  onChange={e => updateChap(c.id, 'title', e.target.value)}
                  placeholder="Chapter title"
                  style={{ flex: 1, fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s1)', color: 'var(--t1)' }}
                />
                <button onClick={() => removeChap(c.id)} style={{ fontSize: 14, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
            ))}
          </div>
          <button
            onClick={addChapter}
            style={{ width: '100%', padding: '7px 0', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)' }}
          >
            + Add Chapter
          </button>
        </>
      )}
    </div>
  )
}
