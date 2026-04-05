'use client'
import { SectionLabel, ChipRow } from './helpers'

const FONTS = ['Outfit', 'Inter', 'Georgia', 'Lora', 'Montserrat', 'Playfair Display']

function ThumbDropzone({ id, value, onChange }) {
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
        border: '2px dashed var(--b2)', borderRadius: 10, padding: '14px 10px',
        textAlign: 'center', cursor: 'pointer', background: 'var(--s3)', marginBottom: 8,
      }}
    >
      <input
        id={id} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <img src={value} style={{ height: 40, borderRadius: 6, objectFit: 'cover', aspectRatio: '16/9' }} alt="thumb" />
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
          <div style={{ fontSize: 10, color: 'var(--t3)' }}>Drop thumbnail · 16:9 recommended</div>
        </>
      )}
    </div>
  )
}

export default function ThumbnailPicker({ b, onChange, videoId }) {
  return (
    <>
      <SectionLabel>Thumbnail Source</SectionLabel>
      <ChipRow
        value={b.thumbnailStyle ?? 0}
        options={[
          { val: 0, label: 'Auto Frame' },
          { val: 1, label: 'Color Fill' },
          { val: 2, label: 'Custom Upload' },
        ]}
        onChange={v => onChange('thumbnailStyle', v)}
      />

      {b.thumbnailStyle === 2 && (
        <ThumbDropzone
          id={`thumb-upload-${videoId}`}
          value={b.thumbnailUrl}
          onChange={v => onChange('thumbnailUrl', v)}
        />
      )}

      <div style={{ height: 6 }} />
      <SectionLabel>Font</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {FONTS.map(f => {
          const act = b.font === f
          return (
            <button
              key={f}
              onClick={() => onChange('font', f)}
              style={{
                padding: '7px 4px', borderRadius: 6,
                fontSize: 10, fontWeight: act ? 700 : 400,
                cursor: 'pointer',
                border: `1px solid ${act ? 'var(--acc)' : 'var(--b2)'}`,
                background: act ? 'rgba(79,110,247,0.1)' : 'var(--s3)',
                color: act ? 'var(--acc)' : 'var(--t2)',
                fontFamily: `${f}, sans-serif`,
              }}
            >
              {f.split(' ')[0]}
            </button>
          )
        })}
      </div>
    </>
  )
}
