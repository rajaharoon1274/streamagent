'use client'
import { SectionLabel, ChipRow, ColorRow, SliderRow, TogRow } from './helpers'

const BAR_STYLE_OPTIONS = [
  { val: 'pill', label: 'Frosted Pill' },
  { val: 'bar', label: 'Full Bar' },
  { val: 'minimal', label: 'Minimal' },
  { val: 'glass', label: 'Glass Card' },
  { val: 'cinema', label: 'Cinematic' },
  { val: 'neon', label: 'Neon Edge' },
  { val: 'soft', label: 'Soft Float' },
  { val: 'accent', label: 'Brand Accent' },
]

export default function ControlsPanel({ b, onChange }) {
  const brand = b.color || '#4F6EF7'

  return (
    <>
      <SectionLabel>Bar Style</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 6 }}>
        {BAR_STYLE_OPTIONS.map(o => {
          const act = (b.barStyle !== 'hidden') && (b.barStyle || 'pill') === o.val
          return (
            <button
              key={o.val}
              onClick={() => onChange('barStyle', o.val)}
              style={{
                padding: '6px 4px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${act ? 'var(--acc)' : 'var(--b2)'}`,
                background: act ? 'rgba(79,110,247,0.1)' : 'var(--s3)',
                color: act ? 'var(--acc)' : 'var(--t2)',
                transition: 'all 0.15s',
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => onChange('barStyle', b.barStyle === 'hidden' ? 'pill' : 'hidden')}
        style={{
          width: '100%', padding: '6px 4px', borderRadius: 7,
          fontSize: 10, fontWeight: 600, cursor: 'pointer', marginBottom: 12,
          border: `1px solid ${b.barStyle === 'hidden' ? 'rgba(255,107,107,0.4)' : 'var(--b2)'}`,
          background: b.barStyle === 'hidden' ? 'rgba(255,107,107,0.08)' : 'var(--s3)',
          color: b.barStyle === 'hidden' ? '#FF6B6B' : 'var(--t2)',
        }}
      >
        {b.barStyle === 'hidden' ? '✓ Bar Hidden' : 'Hide Bar'}
      </button>

      <SectionLabel>Visibility Toggles</SectionLabel>
      <TogRow
        value={b.showProgress !== false}
        label="Progress Bar"
        desc="Scrubber / seek bar"
        onChange={v => onChange('showProgress', v)}
      />
      <TogRow
        value={b.showTime !== false}
        label="Time Display"
        desc="Current / total time"
        onChange={v => onChange('showTime', v)}
      />
      <TogRow
        value={b.showShareButton !== false}
        label="Share Button"
        desc="Share icon in controls"
        onChange={v => onChange('showShareButton', v)}
      />
      <TogRow
        value={b.showVolume !== false}
        label="Volume"
        desc="Volume control"
        onChange={v => onChange('showVolume', v)}
      />
      <TogRow
        value={b.showFullscreen !== false}
        label="Fullscreen"
        desc="Fullscreen button"
        onChange={v => onChange('showFullscreen', v)}
      />
      <TogRow
        value={b.showSettings !== false}
        label="Settings"
        desc="Settings gear icon"
        onChange={v => onChange('showSettings', v)}
      />

      <div style={{ height: 6 }} />
      <SectionLabel>Scrubber</SectionLabel>
      <ChipRow
        value={b.scrubberStyle || 'thin'}
        options={[
          { val: 'thin', label: 'Thin' },
          { val: 'thick', label: 'Thick' },
          { val: 'dot', label: 'Dot' },
        ]}
        onChange={v => onChange('scrubberStyle', v)}
      />
      <ColorRow
        label="Scrubber Color"
        value={b.scrubberColor || brand}
        onChange={v => onChange('scrubberColor', v)}
      />
      <ColorRow
        label="Icon Color"
        value={b.barIconColor || '#ffffff'}
        onChange={v => onChange('barIconColor', v)}
      />

      <SectionLabel>Bar Opacity</SectionLabel>
      <SliderRow
        value={b.barOpacity ?? 0.85}
        onChange={v => onChange('barOpacity', v)}
      />
    </>
  )
}