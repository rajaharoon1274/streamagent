'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function ChipPicker({ label, options, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{label}</div>
      {options.map((o) => {
        const active = value === o.v
        return (
          <div
            key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              padding: '4px 6px', marginBottom: 3, borderRadius: 5, cursor: 'pointer',
              fontSize: 10, fontWeight: 600, textAlign: 'center',
              border: `1px solid ${active ? 'var(--acc)' : 'var(--b2)'}`,
              background: active ? 'rgba(79,110,247,0.1)' : 'var(--s3)',
              color: active ? 'var(--acc)' : 'var(--t2)',
            }}
          >
            {o.l}
          </div>
        )
      })}
    </div>
  )
}

export default function GIFExport({ video: v, accentColor }) {
  const durStr = v.dur || '4:00'
  const [m, s] = durStr.split(':').map(Number)
  const dur    = (m || 0) * 60 + (s || 0) || 240

  const [startPct, setStartPct] = useState(0.1)
  const [endPct,   setEndPct]   = useState(0.35)
  const [fps,      setFps]      = useState(12)
  const [quality,  setQuality]  = useState('medium')
  const [gifWidth, setGifWidth] = useState(480)
  const [exporting, setExporting] = useState(false)

  const startSec  = Math.floor(startPct * dur)
  const endSec    = Math.floor(endPct * dur)
  const clipLen   = endSec - startSec
  const estFrames = Math.round(clipLen * fps)
  const kbPer     = quality === 'high' ? 85 : quality === 'medium' ? 45 : 22
  const sizeKB    = Math.round(estFrames * kbPer * (gifWidth / 640))
  const sizeStr   = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)}MB` : `${sizeKB}KB`
  const accent    = accentColor || '#4F6EF7'

  function handleStartChange(pct) {
    const v2 = pct / 100
    if (v2 < endPct - 0.05) setStartPct(v2)
  }
  function handleEndChange(pct) {
    const v2 = pct / 100
    if (v2 > startPct + 0.05) setEndPct(v2)
  }

  async function exportGIF() {
    setExporting(true)
    try {
      await new Promise(r => setTimeout(r, 1800)) // simulate
      toast.success('GIF exported! (demo)')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>🎞️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Export as GIF</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>Animated clip for emails &amp; social</div>
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--grn)', fontFamily: 'var(--mono, monospace)' }}>
          {clipLen}s · {sizeStr}
        </div>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Clip Range */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clip Range</span>
            <span style={{ fontSize: 10, color: 'var(--t2)', fontFamily: 'var(--mono, monospace)' }}>{fmt(startSec)} → {fmt(endSec)}</span>
          </div>

          {/* Visual bar */}
          <div style={{ position: 'relative', height: 20, marginBottom: 6 }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, transform: 'translateY(-50%)' }} />
            <div style={{
              position: 'absolute', top: '50%', left: `${startPct * 100}%`,
              width: `${(endPct - startPct) * 100}%`, height: 4,
              background: accent, borderRadius: 2, transform: 'translateY(-50%)',
              boxShadow: `0 0 6px ${accent}66`,
            }} />
            <div style={{ position: 'absolute', top: '50%', left: `${startPct * 100}%`, transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
            <div style={{ position: 'absolute', top: '50%', left: `${endPct * 100}%`, transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--t3)', marginBottom: 3 }}>START {fmt(startSec)}</div>
              <input type="range" min={0} max={95} step={1} value={Math.round(startPct * 100)}
                onChange={e => handleStartChange(+e.target.value)}
                style={{ width: '100%', accentColor: accent }} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--t3)', marginBottom: 3 }}>END {fmt(endSec)}</div>
              <input type="range" min={5} max={100} step={1} value={Math.round(endPct * 100)}
                onChange={e => handleEndChange(+e.target.value)}
                style={{ width: '100%', accentColor: accent }} />
            </div>
          </div>
        </div>

        {/* FPS / Quality / Width */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <ChipPicker label="FPS" value={fps} onChange={setFps}
            options={[{v:8,l:'8 fps'},{v:12,l:'12 fps'},{v:24,l:'24 fps'}]} />
          <ChipPicker label="Quality" value={quality} onChange={setQuality}
            options={[{v:'low',l:'Low'},{v:'medium',l:'Med'},{v:'high',l:'High'}]} />
          <ChipPicker label="Width" value={gifWidth} onChange={setGifWidth}
            options={[{v:320,l:'320px'},{v:480,l:'480px'},{v:640,l:'640px'}]} />
        </div>

        {/* Export button */}
        <button
          onClick={exportGIF}
          disabled={exporting}
          style={{
            width: '100%', padding: 10, borderRadius: 9,
            background: exporting ? 'var(--s3)' : 'var(--grn)',
            border: 'none', color: exporting ? 'var(--t3)' : '#0F172A',
            fontSize: 12, fontWeight: 800, cursor: exporting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: exporting ? 'none' : '0 3px 12px rgba(30,216,160,0.25)',
          }}
        >
          {exporting ? (
            <>⏳ Exporting…</>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="23 7 16 12 23 17" /><rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
              Export GIF · {estFrames} frames
            </>
          )}
        </button>
      </div>
    </div>
  )
}
