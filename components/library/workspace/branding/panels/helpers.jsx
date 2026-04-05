'use client'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

// ── Shared UI helpers for all branding panels ────────────────────────────────

export function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: 'var(--t3)',
      textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
    }}>
      {children}
    </div>
  )
}

export function ChipRow({ value, options, onChange, cols }) {
  const gridCols = cols ?? options.length
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
      gap: 4,
      marginBottom: 10,
    }}>
      {options.map(o => {
        const act = value === o.val
        return (
          <button
            key={String(o.val)}
            onClick={() => onChange(o.val)}
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
  )
}

export function TogRow({ value, label, desc, onChange }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid var(--b1)',
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)' }}>{label}</div>
        {desc && <div style={{ fontSize: 10, color: 'var(--t3)' }}>{desc}</div>}
      </div>
      <ToggleSwitch value={!!value} onChange={onChange} />
    </div>
  )
}

export function ColorRow({ label, value, onChange }) {
  const safe = (value && value.startsWith('#') && value.length >= 4) ? value : '#4F6EF7'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <input
          type="color"
          value={safe}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 26, height: 26, borderRadius: 5,
            border: '1px solid var(--b2)', padding: 2,
            background: 'var(--s3)', cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
          {value || ''}
        </span>
      </div>
    </div>
  )
}

export function SliderRow({ label, value, min = 0, max = 1, step = 0.05, format, onChange }) {
  const display = format ? format(value) : Math.round(value * 100) + '%'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 10, color: 'var(--t3)', minWidth: 32, fontFamily: 'var(--mono)' }}>
        {display}
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--acc)' }}
      />
    </div>
  )
}
