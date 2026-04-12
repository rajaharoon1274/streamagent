'use client'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { SectionLabel, ChipRow, SliderRow } from './helpers'

function UploadZone({ videoId, value, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file) {
    if (!file) return
    const ALLOWED = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif']
    if (!ALLOWED.includes(file.type)) {
      toast.error('Invalid file type. Use PNG, JPG, SVG, or WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB.')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const res = await fetch(`/api/videos/${videoId}/logo`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onChange(data.logoUrl)
      toast.success('Logo uploaded!')
    } catch (err) {
      toast.error(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function removeLogo() {
    setUploading(true)
    try {
      const res = await fetch(`/api/videos/${videoId}/logo`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onChange('')
      toast.success('Logo removed.')
    } catch {
      toast.error('Failed to remove logo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
      onClick={() => !uploading && inputRef.current?.click()}
      style={{
        border: `2px dashed ${uploading ? 'var(--acc)' : 'var(--b2)'}`,
        borderRadius: 10, padding: '16px 10px',
        textAlign: 'center', cursor: uploading ? 'wait' : 'pointer',
        background: 'var(--s3)', marginBottom: 8,
        transition: 'border-color 0.2s',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {uploading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid var(--acc)', borderTop: '2px solid transparent',
            animation: 'lp-spin 0.7s linear infinite',
          }} />
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>Uploading…</span>
          <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <img
            src={value}
            style={{ height: 28, borderRadius: 4, objectFit: 'contain', maxWidth: 120 }}
            alt="logo"
          />
          <button
            onClick={e => { e.stopPropagation(); removeLogo() }}
            style={{ fontSize: 10, color: '#FF6B6B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 20, marginBottom: 4 }}>🖼</div>
          <div style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 600 }}>Drop logo or click to upload</div>
          <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>PNG · JPG · SVG · WebP · Max 2 MB</div>
        </>
      )}
    </div>
  )
}

export default function LogoPanel({ b, onChange, videoId }) {
  return (
    <>
      <SectionLabel>Upload Logo</SectionLabel>
      <UploadZone
        videoId={videoId}
        value={b.logoUrl || ''}
        onChange={v => onChange('logoUrl', v)}
      />

      {b.logoUrl && (
        <>
          <SectionLabel>Position</SectionLabel>
          <ChipRow
            value={b.logoPosition || 'top-left'}
            options={[
              { val: 'top-left', label: 'Top L' },
              { val: 'top-right', label: 'Top R' },
              { val: 'bottom-left', label: 'Bot L' },
              { val: 'bottom-right', label: 'Bot R' },
            ]}
            onChange={v => onChange('logoPosition', v)}
          />

          <SectionLabel>Size</SectionLabel>
          <ChipRow
            value={b.logoSize || 'small'}
            options={[
              { val: 'small', label: 'Small' },
              { val: 'medium', label: 'Medium' },
              { val: 'large', label: 'Large' },
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