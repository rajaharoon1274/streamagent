'use client'

function ColorField({ label, value, defaultValue, onChange }) {
  const safe = (value && value.startsWith('#') && value.length >= 4) ? value : (defaultValue || '#000000')
  const isDefault = value === defaultValue

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--t3)',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
      }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* Default swatch */}
        <div
          onClick={() => onChange(defaultValue)}
          title="Reset to default"
          style={{
            width: 28, height: 28, borderRadius: 6, background: defaultValue,
            cursor: 'pointer', border: `2px solid ${isDefault ? 'var(--acc)' : 'var(--b2)'}`,
            boxSizing: 'border-box', flexShrink: 0, position: 'relative',
          }}
        >
          {isDefault && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </div>
          )}
        </div>
        {/* Color input */}
        <input
          type="color"
          value={safe}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid var(--b2)', padding: 2,
            background: 'var(--s3)', cursor: 'pointer', flexShrink: 0,
          }}
        />
        {/* Hex text */}
        <input
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, padding: '4px 8px', borderRadius: 7, fontSize: 10,
            fontFamily: 'var(--mono)', background: 'var(--s3)',
            border: '1px solid var(--b2)', color: 'var(--t1)', outline: 'none',
          }}
        />
      </div>
    </div>
  )
}

export default function ColorsSection({ lp, onChange, accentColor }) {
  const brandDefault = accentColor || '#4F6EF7'

  return (
    <>
      <ColorField
        label="Background"
        value={lp.bg || '#0F172A'}
        defaultValue="#0F172A"
        onChange={v => onChange('bg', v)}
      />
      <ColorField
        label="Text Color"
        value={lp.tc || '#EEF2FF'}
        defaultValue="#EEF2FF"
        onChange={v => onChange('tc', v)}
      />
      <ColorField
        label="Brand Color"
        value={lp.brand || brandDefault}
        defaultValue={brandDefault}
        onChange={v => onChange('brand', v)}
      />
    </>
  )
}
