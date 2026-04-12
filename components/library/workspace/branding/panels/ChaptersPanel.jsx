'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { TogRow, SectionLabel } from './helpers'

function fmt(s) {
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0')
}

function parseTime(str) {
  const parts = str.split(':')
  return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0)
}

export default function ChaptersPanel({ b, onChange }) {
  const { state, set } = useApp()
  const [generating, setGenerating] = useState(false)
  const chapters = state.aiChapters || []

  const generate = () => {
    setGenerating(true)
    setTimeout(() => {
      set({
        aiChapters: [
          { start: 0, end: 45, emoji: '🎯', title: 'Introduction' },
          { start: 45, end: 110, emoji: '📊', title: 'The Core Method' },
          { start: 110, end: 175, emoji: '⚡', title: 'Lead Capture System' },
          { start: 175, end: 240, emoji: '🚀', title: 'Implementation Steps' },
        ],
      })
      setGenerating(false)
    }, 1600)
  }

  const update = (i, key, val) => {
    set({ aiChapters: chapters.map((c, ci) => ci === i ? { ...c, [key]: val } : c) })
  }

  const remove = (i) => set({ aiChapters: chapters.filter((_, ci) => ci !== i) })

  const add = () => set({
    aiChapters: [...chapters, { start: 0, end: 10, emoji: '📌', title: 'New Chapter' }],
  })

  return (
    <>
      {/* ── SECTION 1: Branding toggles → saves to DB via branding ── */}
      <SectionLabel>Player Chapter Controls</SectionLabel>
      <TogRow
        value={b.chapters !== false}
        label="Show Chapter Markers"
        desc="Display chapter dots on the progress bar"
        onChange={v => onChange('chapters', v)}
      />
      {b.chapters !== false && (
        <TogRow
          value={b.chapterTitles !== false}
          label="Show Chapter Titles"
          desc="Display chapter name on hover"
          onChange={v => onChange('chapterTitles', v)}
        />
      )}

      {/* ── Divider ── */}
      <div style={{ margin: '14px 0 10px', borderTop: '1px solid var(--b1)' }} />
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
        ✨ AI Chapter Generator
      </div>

      {/* ── SECTION 2: AI chapter generator → saves to useApp global state ── */}
      {chapters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📖</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>No AI Chapters Yet</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.5 }}>
            AI will analyze your video and create chapter markers with timestamps automatically.
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
            {generating ? '⏳ Generating…' : '✨ Generate Chapters'}
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--grn)' }}>✓ {chapters.length} Chapters</div>
            <button
              onClick={generate}
              style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 9, fontWeight: 600, cursor: 'pointer' }}
            >
              ↻ Regen
            </button>
          </div>

          {chapters.map((ch, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', marginBottom: 5 }}
            >
              <input
                value={ch.emoji}
                onChange={e => update(i, 'emoji', e.target.value)}
                style={{ width: 26, textAlign: 'center', background: 'transparent', border: 'none', fontSize: 13, padding: 0, cursor: 'text', color: 'var(--t1)' }}
              />
              <input
                value={fmt(ch.start)}
                onChange={e => update(i, 'start', parseTime(e.target.value))}
                style={{ width: 42, fontSize: 9, fontFamily: 'var(--mono)', padding: '3px 4px', background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 5, textAlign: 'center', color: 'var(--t1)', outline: 'none' }}
              />
              <input
                value={ch.title}
                onChange={e => update(i, 'title', e.target.value)}
                style={{ flex: 1, fontSize: 10, padding: '3px 7px', background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 5, color: 'var(--t1)', outline: 'none' }}
              />
              <button
                onClick={() => remove(i)}
                style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 4, background: 'none', border: '1px solid var(--b2)', color: '#FF6B6B', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={add}
            style={{ width: '100%', padding: 6, borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
          >
            + Add Chapter
          </button>
        </>
      )}
    </>
  )
}