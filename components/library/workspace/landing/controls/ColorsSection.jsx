'use client'

const inp = {
  width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 11,
  background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--fn)',
}

function Label({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--t3)',
      textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
    }}>
      {children}
    </label>
  )
}

function ColorRow({ value, defaultValue, onChange }) {
  const safe = (value && value.startsWith('#') && value.length >= 4)
    ? value : (defaultValue || '#000000')
  const isDefault = value === defaultValue

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {/* Reset swatch */}
      <div
        onClick={() => onChange(defaultValue)}
        title="Reset to default"
        style={{
          width: 28, height: 28, borderRadius: 6, background: defaultValue,
          cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box',
          border: `2px solid ${isDefault ? 'var(--acc)' : 'var(--b2)'}`,
          position: 'relative',
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
      {/* Native color picker */}
      <input
        type="color" value={safe} onChange={e => onChange(e.target.value)}
        style={{
          width: 28, height: 28, borderRadius: 6, padding: 2,
          border: '1px solid var(--b2)', background: 'var(--s3)',
          cursor: 'pointer', flexShrink: 0,
        }}
      />
      {/* Hex input */}
      <input
        value={value || ''} onChange={e => onChange(e.target.value)}
        style={{
          flex: 1, padding: '4px 8px', borderRadius: 7, fontSize: 10,
          fontFamily: 'var(--mono)', background: 'var(--s3)',
          border: '1px solid var(--b2)', color: 'var(--t1)', outline: 'none',
        }}
      />
    </div>
  )
}

const BG_TYPES = [
  { id: 'solid', label: '■ Solid' },
  { id: 'gradient', label: '◑ Gradient' },
  { id: 'image', label: '🖼 Image' },
]

export default function ColorsSection({ lp, onChange, accentColor }) {
  const brandDefault = accentColor || '#4F6EF7'
  const bgType = lp.bgType || 'solid'

  return (
    <>
      {/* ── Background type toggle ── */}
      <div style={{ marginBottom: 14 }}>
        <Label>Background Type</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          {BG_TYPES.map(t => {
            const active = bgType === t.id
            return (
              <button
                key={t.id}
                onClick={() => onChange('bgType', t.id)}
                style={{
                  flex: 1, padding: '5px 4px', borderRadius: 7,
                  fontSize: 9, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--acc)' : 'var(--b2)'}`,
                  background: active ? 'rgba(79,110,247,0.12)' : 'var(--s3)',
                  color: active ? 'var(--acc)' : 'var(--t3)',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Solid ── */}
      {bgType === 'solid' && (
        <div style={{ marginBottom: 14 }}>
          <Label>Background Color</Label>
          <ColorRow
            value={lp.bgColor || lp.bg || '#0F172A'}
            defaultValue="#0F172A"
            onChange={v => { onChange('bgColor', v); onChange('bg', v) }}
          />
        </div>
      )}

      {/* ── Gradient ── */}
      {bgType === 'gradient' && (
        <div style={{ marginBottom: 14 }}>
          <Label>CSS Gradient</Label>
          <input
            style={inp}
            value={lp.bgGradient || 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'}
            onChange={e => onChange('bgGradient', e.target.value)}
            placeholder="linear-gradient(135deg, #0F172A 0%, #4F6EF7 100%)"
          />
          <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 3 }}>
            Any valid CSS gradient value
          </div>
          {/* Live swatch */}
          <div style={{
            marginTop: 7, height: 28, borderRadius: 7,
            background: lp.bgGradient || 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            border: '1px solid var(--b2)',
          }} />
        </div>
      )}

      {/* ── Image ── */}
      {bgType === 'image' && (
        <div style={{ marginBottom: 14 }}>
          <Label>Background Image URL</Label>
          <input
            style={inp}
            value={lp.bgImageUrl || ''}
            onChange={e => onChange('bgImageUrl', e.target.value)}
            placeholder="https://example.com/your-bg.jpg"
          />
          {lp.bgImageUrl && (
            <div style={{ marginTop: 7, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--b2)', height: 60 }}>
              <img src={lp.bgImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="bg preview" />
            </div>
          )}
        </div>
      )}

      {/* ── Text color ── */}
      <div style={{ marginBottom: 14 }}>
        <Label>Text Color</Label>
        <ColorRow
          value={lp.textColor || lp.tc || '#EEF2FF'}
          defaultValue="#EEF2FF"
          onChange={v => { onChange('textColor', v); onChange('tc', v) }}
        />
      </div>

      {/* ── Brand / accent ── */}
      <div style={{ marginBottom: 14 }}>
        <Label>Brand / Accent Color</Label>
        <ColorRow
          value={lp.brand || brandDefault}
          defaultValue={brandDefault}
          onChange={v => onChange('brand', v)}
        />
      </div>
    </>
  )
}