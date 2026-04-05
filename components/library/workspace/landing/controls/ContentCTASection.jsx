'use client'

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{
        display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--t3)',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 11,
  background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--fn)',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical', lineHeight: 1.6, minHeight: 60,
}

function ImgDrop({ id, value, onChange }) {
  const handleFile = (file) => {
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
      <input id={id} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <img src={value} style={{ height: 28, borderRadius: 4, objectFit: 'contain' }} alt="logo" />
          <button onClick={e => { e.stopPropagation(); onChange('') }}
            style={{ fontSize: 10, color: '#FF6B6B', background: 'none', border: 'none', cursor: 'pointer' }}>
            Remove
          </button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 10, color: 'var(--t3)' }}>Drop your logo or click to upload</div>
          <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>PNG · JPG · SVG · WebP</div>
        </>
      )}
    </div>
  )
}

export default function ContentCTASection({ lp, onChange, videoId }) {
  return (
    <>
      <Field label="Logo">
        <ImgDrop
          id={`lp-logo-${videoId}`}
          value={lp.logoUrl}
          onChange={v => onChange('logoUrl', v)}
        />
        <input
          style={inputStyle}
          value={lp.logoText || ''}
          placeholder="StreamAgent"
          onChange={e => onChange('logoText', e.target.value)}
        />
        <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 3 }}>Text shown next to logo</div>
      </Field>

      <Field label="Headline">
        <textarea
          style={textareaStyle}
          value={lp.headline || ''}
          onChange={e => onChange('headline', e.target.value)}
          rows={2}
        />
      </Field>

      <Field label="Subheadline">
        <input
          style={inputStyle}
          value={lp.subheadline || ''}
          placeholder="Enter your email and hit play…"
          onChange={e => onChange('subheadline', e.target.value)}
        />
      </Field>

      <Field label="Body Text (below video)">
        <textarea
          style={{ ...textareaStyle, minHeight: 80 }}
          value={lp.body || ''}
          onChange={e => onChange('body', e.target.value)}
          rows={3}
        />
      </Field>

      <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 10, marginTop: 4 }} />

      <Field label="Button Text">
        <input
          style={inputStyle}
          value={lp.ctaText || ''}
          placeholder="Book a Free Call"
          onChange={e => onChange('ctaText', e.target.value)}
        />
      </Field>

      <Field label="Button URL">
        <input
          style={inputStyle}
          value={lp.ctaUrl || ''}
          placeholder="https://calendly.com/yourname"
          onChange={e => onChange('ctaUrl', e.target.value)}
        />
      </Field>
    </>
  )
}
