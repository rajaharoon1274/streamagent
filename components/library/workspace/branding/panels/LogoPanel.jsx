'use client'
import { SectionLabel, ChipRow, SliderRow } from './helpers'

function ImgDropzone({ id, value, label, onChange }) {
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
      style={{
        border: '2px dashed var(--b2)', borderRadius: 10, padding: '16px 10px',
        textAlign: 'center', cursor: 'pointer', background: 'var(--s3)', marginBottom: 8,
        position: 'relative',
      }}
      onClick={() => document.getElementById(id)?.click()}
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
          <div style={{ fontSize: 20, marginBottom: 4 }}>🖼</div>
          <div style={{ fontSize: 10, color: 'var(--t3)' }}>{label}</div>
          <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>PNG · JPG · SVG · WebP</div>
        </>
      )}
    </div>
  )
}

export default function LogoPanel({ b, onChange, videoId }) {
  return (
    <>
      <SectionLabel>Upload Logo</SectionLabel>
      <ImgDropzone
        id={`logo-upload-${videoId}`}
        value={b.logoUrl}
        label="Drop your logo or click to upload"
        onChange={v => onChange('logoUrl', v)}
      />

      {b.logoUrl && (
        <>
          <SectionLabel>Position</SectionLabel>
          <ChipRow
            value={b.logoPosition}
            options={[
              { val: 'top-left',     label: 'Top L' },
              { val: 'top-right',    label: 'Top R' },
              { val: 'bottom-left',  label: 'Bot L' },
              { val: 'bottom-right', label: 'Bot R' },
            ]}
            onChange={v => onChange('logoPosition', v)}
          />

          <SectionLabel>Size</SectionLabel>
          <ChipRow
            value={b.logoSize}
            options={[
              { val: 'small',  label: 'Small' },
              { val: 'medium', label: 'Medium' },
              { val: 'large',  label: 'Large' },
            ]}
            onChange={v => onChange('logoSize', v)}
          />

          <SectionLabel>Opacity</SectionLabel>
          <SliderRow
            value={b.logoOpacity ?? 0.8}
            onChange={v => onChange('logoOpacity', v)}
          />

          <SectionLabel>Click URL</SectionLabel>
          <input
            value={b.logoClickUrl || ''}
            onChange={e => onChange('logoClickUrl', e.target.value)}
            placeholder="https://yoursite.com"
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 11,
              background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)',
              outline: 'none', boxSizing: 'border-box', marginBottom: 8,
            }}
          />
        </>
      )}
    </>
  )
}
