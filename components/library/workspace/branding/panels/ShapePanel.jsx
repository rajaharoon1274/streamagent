'use client'
import { SectionLabel, ChipRow, TogRow, ColorRow, SliderRow } from './helpers'

export default function ShapePanel({ b, onChange }) {
  return (
    <>
      <SectionLabel>Corner Radius</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)', minWidth: 34 }}>
          {b.cornerRadius ?? 0}px
        </span>
        <input
          type="range" min={0} max={24} step={1}
          value={b.cornerRadius ?? 0}
          onChange={e => onChange('cornerRadius', parseInt(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--acc)' }}
        />
      </div>
      <ChipRow
        value={b.cornerRadius}
        options={[
          { val: 0,  label: 'Sharp' },
          { val: 8,  label: 'Subtle' },
          { val: 16, label: 'Rounded' },
          { val: 24, label: 'Pill' },
        ]}
        onChange={v => onChange('cornerRadius', v)}
      />

      <TogRow
        value={b.borderEnabled}
        label="Border"
        desc="Visible border around player"
        onChange={v => onChange('borderEnabled', v)}
      />
      {b.borderEnabled && (
        <div style={{ marginTop: 6 }}>
          <ColorRow
            label="Border Color"
            value={b.borderColor || 'rgba(255,255,255,0.1)'}
            onChange={v => onChange('borderColor', v)}
          />
        </div>
      )}

      <div style={{ height: 6 }} />
      <SectionLabel>Ambient Glow</SectionLabel>
      <TogRow
        value={b.ambientGlow}
        label="Ambient Glow"
        desc="Color bleed behind player"
        onChange={v => onChange('ambientGlow', v)}
      />
      {b.ambientGlow && (
        <div style={{ marginTop: 6 }}>
          <SliderRow
            label="Intensity"
            value={b.ambientIntensity ?? 0.4}
            onChange={v => onChange('ambientIntensity', v)}
          />
        </div>
      )}
    </>
  )
}
