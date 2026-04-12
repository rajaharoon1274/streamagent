'use client'
import { ColorRow, SectionLabel } from './helpers'

const PALETTES = [
  { name: 'Electric Blue', c: '#4F6EF7', s: '#1ED8A0' },
  { name: 'Sunset', c: '#FF6B6B', s: '#F5A623' },
  { name: 'Royal Purple', c: '#A855F7', s: '#F06292' },
  { name: 'Clean Dark', c: '#0F172A', s: '#4F6EF7' },
  { name: 'Emerald', c: '#10B981', s: '#06B6D4' },
  { name: 'Dark Gold', c: '#F5A623', s: '#0F172A' },
]

export default function ColorsPanel({ b, onChange }) {
  const applyPalette = (p) => {
    onChange('color', p.c)
    onChange('secondaryColor', p.s)
    onChange('playBtnColor', p.c)
    onChange('scrubberColor', p.c)
  }

  return (
    <>
      <ColorRow
        label="Primary Brand"
        value={b.color || '#4F6EF7'}
        onChange={v => onChange('color', v)}
      />
      <ColorRow
        label="Secondary"
        value={b.secondaryColor || '#1ED8A0'}
        onChange={v => onChange('secondaryColor', v)}
      />
      <ColorRow
        label="Text / Icons"
        value={b.textColor || '#ffffff'}
        onChange={v => onChange('textColor', v)}
      />
      <ColorRow
        label="Play Button"
        value={b.playBtnColor || b.color || '#4F6EF7'}
        onChange={v => onChange('playBtnColor', v)}
      />
      <ColorRow
        label="Scrubber"
        value={b.scrubberColor || b.color || '#4F6EF7'}
        onChange={v => onChange('scrubberColor', v)}
      />

      <SectionLabel>Quick Palettes</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
        {PALETTES.map(p => {
          const isActive = b.color === p.c && b.secondaryColor === p.s
          return (
            <div
              key={p.name}
              onClick={() => applyPalette(p)}
              style={{
                padding: '7px 9px', borderRadius: 8, cursor: 'pointer',
                background: 'var(--s3)',
                border: `1px solid ${isActive ? p.c : 'var(--b2)'}`,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'border-color 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = p.c }}
              onMouseOut={e => { e.currentTarget.style.borderColor = isActive ? p.c : 'var(--b2)' }}
            >
              <div style={{ display: 'flex', gap: 3 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: p.c }} />
                <div style={{ width: 14, height: 14, borderRadius: 4, background: p.s }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--t2)' }}>{p.name}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}