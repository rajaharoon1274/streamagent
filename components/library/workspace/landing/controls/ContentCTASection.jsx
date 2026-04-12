'use client'

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

const inp = {
  width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 11,
  background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--fn)',
}

const ta = { ...inp, resize: 'vertical', lineHeight: 1.6, minHeight: 60 }

function ImgDrop({ id, value, onChange }) {
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => onChange(e.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
      onClick={() => document.getElementById(id)?.click()}
      style={{
        border: '2px dashed var(--b2)', borderRadius: 9, padding: '14px 10px',
        textAlign: 'center', cursor: 'pointer', background: 'var(--s3)', marginBottom: 8,
      }}
    >
      <input
        id={id} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <img src={value} style={{ height: 28, borderRadius: 4, objectFit: 'contain' }} alt="logo" />
          <button
            onClick={e => { e.stopPropagation(); onChange('') }}
            style={{ fontSize: 10, color: '#FF6B6B', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 10, color: 'var(--t3)' }}>Drop logo or click to upload</div>
          <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>PNG · JPG · SVG · WebP</div>
        </>
      )}
    </div>
  )
}

export default function ContentCTASection({ lp, onChange, videoId }) {
  return (
    <>
      {/* Logo */}
      <Field label="Logo">
        <ImgDrop id={`lp-logo-${videoId}`} value={lp.logoUrl} onChange={v => onChange('logoUrl', v)} />
        <input
          style={inp} value={lp.logoText || ''} placeholder="StreamAgent"
          onChange={e => onChange('logoText', e.target.value)}
        />
        <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 3 }}>Text shown next to logo</div>
      </Field>

      {/* Headline */}
      <Field label="Headline">
        <textarea
          style={{ ...ta, minHeight: 52 }}
          value={lp.headline || ''}
          onChange={e => onChange('headline', e.target.value)}
          rows={2}
        />
      </Field>

      {/* Subtext */}
      <Field label="Subtext" hint="One-liner shown below the headline">
        <input
          style={inp}
          value={lp.subtext || lp.subheadline || ''}
          placeholder="A compelling line about your video…"
          onChange={e => {
            onChange('subtext', e.target.value)
            onChange('subheadline', e.target.value)   // keep both keys in sync
          }}
        />
      </Field>

      {/* Body HTML */}
      <Field
        label="Body Copy (HTML supported)"
        hint="Shown below the video. Supports <b>, <i>, <ul>, <li>, <a> tags."
      >
        <textarea
          style={{ ...ta, minHeight: 88, fontFamily: 'var(--mono)', fontSize: 10 }}
          value={lp.bodyHtml || lp.body || ''}
          placeholder={'<p>Discover the <b>exact system</b> we used to…</p>'}
          onChange={e => {
            onChange('bodyHtml', e.target.value)
            onChange('body', e.target.value)           // keep plain-body in sync
          }}
          rows={4}
        />
      </Field>

      <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 10, marginTop: 4 }} />

      {/* CTA Text */}
      <Field label="Button Text">
        <input
          style={inp} value={lp.ctaText || ''} placeholder="Book a Free Call"
          onChange={e => onChange('ctaText', e.target.value)}
        />
      </Field>

      {/* CTA URL */}
      <Field label="Button URL">
        <input
          style={inp} value={lp.ctaUrl || ''} placeholder="https://calendly.com/yourname"
          onChange={e => onChange('ctaUrl', e.target.value)}
        />
      </Field>

      {/* CTA Color */}
      <Field label="Button Color">
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="color"
            value={lp.ctaColor || lp.brand || '#4F6EF7'}
            onChange={e => onChange('ctaColor', e.target.value)}
            style={{
              width: 32, height: 32, borderRadius: 7, padding: 2,
              border: '1px solid var(--b2)', background: 'var(--s3)',
              cursor: 'pointer', flexShrink: 0,
            }}
          />
          <input
            style={{ ...inp, fontFamily: 'var(--mono)' }}
            value={lp.ctaColor || ''}
            placeholder={lp.brand || '#4F6EF7'}
            onChange={e => onChange('ctaColor', e.target.value)}
          />
        </div>
      </Field>
    </>
  )
}