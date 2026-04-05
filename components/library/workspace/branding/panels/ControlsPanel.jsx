'use client'
import { SectionLabel, ChipRow, ColorRow, SliderRow } from './helpers'

export default function ControlsPanel({ b, onChange }) {
  const brand = b.color || '#4F6EF7'

  const barOptions = [
    { val: 'pill',    label: 'Pill' },
    { val: 'bar',     label: 'Bar' },
    { val: 'minimal', label: 'Minimal' },
    { val: 'glass',   label: 'Glass' },
    { val: 'cinema',  label: 'Cinema' },
    { val: 'neon',    label: 'Neon' },
    { val: 'soft',    label: 'Soft' },
    { val: 'accent',  label: 'Accent' },
  ]

  return (
    <>
      <SectionLabel>Bar Style</SectionLabel>
      <ChipRow
        value={b.barStyle === 'hidden' ? '' : b.barStyle}
        options={barOptions}
        onChange={v => onChange('barStyle', v)}
        cols={2}
      />

      {/* Hidden bar button */}
      <button
        onClick={() => onChange('barStyle', b.barStyle === 'hidden' ? 'pill' : 'hidden')}
        style={{
          width: '100%', padding: '6px 4px', borderRadius: 7,
          fontSize: 10, fontWeight: 600, cursor: 'pointer', marginBottom: 10,
          border: `1px solid ${b.barStyle === 'hidden' ? 'rgba(255,107,107,0.4)' : 'var(--b2)'}`,
          background: b.barStyle === 'hidden' ? 'rgba(255,107,107,0.08)' : 'var(--s3)',
          color: b.barStyle === 'hidden' ? '#FF6B6B' : 'var(--t2)',
        }}
      >
        {b.barStyle === 'hidden' ? '✓ Bar Hidden' : 'Hide Bar'}
      </button>

      <SectionLabel>Scrubber</SectionLabel>
      <ChipRow
        value={b.scrubberStyle}
        options={[
          { val: 'thin',  label: 'Thin' },
          { val: 'thick', label: 'Thick' },
          { val: 'dot',   label: 'Dot' },
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
