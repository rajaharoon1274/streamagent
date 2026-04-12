'use client'

const inp = {
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
      {hint && (
        <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
    </div>
  )
}

export default function SEOSection({ lp, onChange, video }) {
  const descValue = lp.seoDescription || lp.seoDesc || ''

  function autoPopulate() {
    if (!lp.seoTitle)
      onChange('seoTitle', video?.title || '')
    if (!lp.seoDescription && !lp.seoDesc)
      onChange('seoDescription', lp.subtext || lp.subheadline || lp.headline || '')
    if (!lp.seoImage)
      onChange('seoImage', video?.thumbnail_url || '')
  }

  return (
    <>
      {/* Auto-fill button */}
      <button
        onClick={autoPopulate}
        style={{
          width: '100%', marginBottom: 12, padding: '6px 0', borderRadius: 8,
          background: 'var(--s3)', border: '1px solid var(--b2)',
          color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}
      >
        ✨ Auto-fill from video
      </button>

      <Field label="Page Title" hint="Browser tab + OG title">
        <input
          style={inp}
          value={lp.seoTitle || ''}
          placeholder={video?.title || 'Your Page Title'}
          onChange={e => onChange('seoTitle', e.target.value)}
        />
      </Field>

      <Field label="Meta Description" hint="Keep under 160 characters for Google">
        <textarea
          style={{ ...inp, resize: 'vertical', minHeight: 56, lineHeight: 1.6 }}
          value={descValue}
          placeholder="A short description for search results…"
          onChange={e => {
            onChange('seoDescription', e.target.value)
            onChange('seoDesc', e.target.value)
          }}
          rows={2}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
          <span style={{ fontSize: 9, color: descValue.length > 160 ? '#FF6B6B' : 'var(--t3)' }}>
            {descValue.length} / 160
          </span>
        </div>
      </Field>

      <Field label="OG Image URL" hint="Social share image — 1200×630px recommended">
        <input
          style={inp}
          value={lp.seoImage || ''}
          placeholder={video?.thumbnail_url || 'https://…/og-image.jpg'}
          onChange={e => onChange('seoImage', e.target.value)}
        />
        {/* Preview */}
        {(lp.seoImage || video?.thumbnail_url) && (
          <div style={{ marginTop: 6, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--b2)' }}>
            <img
              src={lp.seoImage || video?.thumbnail_url}
              style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }}
              alt="OG preview"
            />
          </div>
        )}
      </Field>
    </>
  )
}