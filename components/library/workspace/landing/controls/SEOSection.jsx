'use client'

const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 11,
  background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--fn)',
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{
        display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--t3)',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
      }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  )
}

export default function SEOSection({ lp, onChange }) {
  return (
    <>
      <Field label="Page Title" hint="Used for the browser tab title and Open Graph">
        <input
          style={inputStyle}
          value={lp.seoTitle || ''}
          placeholder="Best Video for Realtors | Your Brand"
          onChange={e => onChange('seoTitle', e.target.value)}
        />
      </Field>

      <Field
        label="Meta Description"
        hint="Shown in Google search results. Keep under 160 characters."
      >
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 56, lineHeight: 1.6 }}
          value={lp.seoDesc || ''}
          placeholder="A short description for search results…"
          onChange={e => onChange('seoDesc', e.target.value)}
          rows={2}
        />
      </Field>

      {/* Character count for meta description */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
        <span style={{
          fontSize: 9, color: (lp.seoDesc || '').length > 160 ? '#FF6B6B' : 'var(--t3)',
        }}>
          {(lp.seoDesc || '').length} / 160
        </span>
      </div>
    </>
  )
}
