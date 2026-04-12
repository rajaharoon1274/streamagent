'use client'
import { SectionLabel, ChipRow, TogRow, ColorRow, SliderRow } from './helpers'

const PLAYER_MODES = [
  { val: 'frosted-pill', label: 'Frosted Pill'  },
  { val: 'full-bar',     label: 'Full Bar'       },
  { val: 'minimal',      label: 'Minimal'        },
  { val: 'glass-card',   label: 'Glass Card'     },
  { val: 'cinematic',    label: 'Cinematic'      },
  { val: 'neon-edge',    label: 'Neon Edge'      },
  { val: 'soft-float',   label: 'Soft Float'     },
  { val: 'brand-accent', label: 'Brand Accent'   },
]

export default function ShapePanel({ b, onChange }) {
  return (
    <>
      <SectionLabel>Player Mode</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12 }}>
        {PLAYER_MODES.map(m => {
          const act = (b.playerMode || 'frosted-pill') === m.val
          return (
            <button
              key={m.val}
              onClick={() => onChange('playerMode', m.val)}
              style={{
                padding: '7px 4px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', textAlign: 'center',
                border: `1px solid ${act ? 'var(--acc)' : 'var(--b2)'}`,
                background: act ? 'rgba(79,110,247,0.12)' : 'var(--s3)',
                color: act ? 'var(--acc)' : 'var(--t2)',
                transition: 'all 0.15s',
              }}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      <SectionLabel>Corner Radius</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)', minWidth: 34 }}>
          {b.cornerRadius ?? 12}px
        </span>
        <input
          type="range" min={0} max={24} step={1}
          value={b.cornerRadius ?? 12}
          onChange={e => onChange('cornerRadius', parseInt(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--acc)' }}
        />
      </div>
      <ChipRow
        value={b.cornerRadius}
        options={[
          { val: 0,  label: 'Sharp'   },
          { val: 8,  label: 'Subtle'  },
          { val: 16, label: 'Rounded' },
          { val: 24, label: 'Pill'    },
        ]}
        onChange={v => onChange('cornerRadius', v)}
      />

      <TogRow
        value={b.borderEnabled === true}
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
        value={b.ambientGlow === true}
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