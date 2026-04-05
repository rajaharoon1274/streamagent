'use client'
import { useState } from 'react'

export default function QRCodeCard({ video: v }) {
  const [generated, setGenerated] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const slug   = (v.title || 'video').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://streamagent.io'
  const lpUrl  = `${origin}/v/${slug}`
  const qrSrc  = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&color=FFFFFF&bgcolor=1E293B&data=${encodeURIComponent(lpUrl)}`

  async function download() {
    setDownloading(true)
    try {
      const res  = await fetch(qrSrc)
      const blob = await res.blob()
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `${slug}-qr.png`
      a.click()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>QR Code</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Scannable link to your landing page</div>
        </div>
        {!generated ? (
          <button
            onClick={() => setGenerated(true)}
            style={{ padding: '6px 14px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Generate QR
          </button>
        ) : (
          <button
            onClick={download}
            disabled={downloading}
            style={{ padding: '6px 14px', borderRadius: 7, background: 'rgba(30,216,160,0.12)', border: '1px solid var(--grn)', color: 'var(--grn)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            {downloading ? 'Downloading…' : '⬇ Download'}
          </button>
        )}
      </div>

      {/* QR preview */}
      {generated && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, background: '#1E293B', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="QR code" width={160} height={160} style={{ display: 'block', borderRadius: 6 }} />
          </div>
          <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--mono, monospace)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
            {lpUrl}
          </div>
        </div>
      )}
    </div>
  )
}
