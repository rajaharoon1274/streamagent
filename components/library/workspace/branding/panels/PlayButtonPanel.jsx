'use client'
import { SectionLabel, ChipRow, TogRow, ColorRow } from './helpers'

export default function PlayButtonPanel({ b, onChange }) {
  const brand = b.color || '#4F6EF7'

  return (
    <>
      <SectionLabel>Shape</SectionLabel>
      <ChipRow
        value={b.playBtnShape}
        options={[
          { val: 'circle', label: 'Circle' },
          { val: 'square', label: 'Rounded' },
          { val: 'pill',   label: 'Pill' },
        ]}
        onChange={v => onChange('playBtnShape', v)}
      />

      <SectionLabel>Size</SectionLabel>
      <ChipRow
        value={b.playBtnSize}
        options={[
          { val: 'small',  label: 'S' },
          { val: 'medium', label: 'M' },
          { val: 'large',  label: 'L' },
        ]}
        onChange={v => onChange('playBtnSize', v)}
      />

      <ColorRow
        label="Color"
        value={b.playBtnColor || brand}
        onChange={v => onChange('playBtnColor', v)}
      />

      <TogRow
        value={b.playBtnBorder}
        label="Border"
        desc="White border ring"
        onChange={v => onChange('playBtnBorder', v)}
      />
      <TogRow
        value={b.playBtnPulse}
        label="Pulse"
        desc="Subtle glow effect"
        onChange={v => onChange('playBtnPulse', v)}
      />
    </>
  )
}
