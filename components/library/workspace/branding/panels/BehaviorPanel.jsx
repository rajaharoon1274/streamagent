'use client'
import { useState } from 'react'
import { TogRow } from './helpers'

function BehavCard({ id, icon, title, summary, open, onToggle, children }) {
  return (
    <div style={{
      background: 'var(--s3)', border: '1px solid var(--b2)',
      borderRadius: 10, marginBottom: 8, overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{title}</div>
          {summary && (
            <div style={{
              fontSize: 9, color: 'var(--t3)', marginTop: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {summary}
            </div>
          )}
        </div>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round">
          {open
            ? <polyline points="6,9 12,15 18,9" />
            : <polyline points="9,18 15,12 9,6" />
          }
        </svg>
      </div>
      {open && (
        <div style={{ padding: '2px 12px 10px', borderTop: '1px solid var(--b1)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function SelectRow({ label, value, options, onChange }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid var(--b1)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)' }}>{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 7,
          padding: '4px 8px', fontSize: 10, color: 'var(--t1)', fontFamily: 'var(--fn)', cursor: 'pointer',
        }}
      >
        {options.map(o => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </div>
  )
}

export default function BehaviorPanel({ b, onChange }) {
  const [open, setOpen] = useState({ start: true, playback: false, other: false })
  const toggle = (id) => setOpen(p => ({ ...p, [id]: !p[id] }))

  const autoplayLabels = {
    'off': 'Off', 'silent-preview': 'Silent Preview', 'always': 'Always',
    'scroll': 'When in View', 'desktop': 'Desktop Only', 'returning': 'Returning Visitors',
  }
  const endLabels = {
    'pause-last': 'Pause last frame', 'loop': 'Loop',
    'show-thumbnail': 'Show Thumbnail', 'show-cta': 'CTA Overlay',
  }

  const startSummary = [
    autoplayLabels[b.autoplayMode || 'off'] !== 'Off' ? autoplayLabels[b.autoplayMode] : null,
    b.mutedStart ? 'Muted' : null,
    'End: ' + (endLabels[b.endAction] || 'Pause'),
    b.resumePlayback ? 'Resume' : null,
  ].filter(Boolean).join(' · ')

  const pbSummary = [
    b.showPlaybar !== false ? 'Playbar' : null,
    b.captions ? 'CC' : null,
    b.showVolume !== false ? 'Vol' : null,
    b.showSpeed !== false ? 'Speed' : null,
    b.showFullscreen !== false ? 'FS' : null,
    b.chapters ? 'Chapters' : null,
  ].filter(Boolean).join(' · ')

  const otherSummary = [
    b.ctaReplayPrevention !== false ? 'Smart Replay' : null,
    b.keyboardShortcuts !== false ? 'Keyboard' : null,
    b.badge !== false ? 'Badge' : null,
  ].filter(Boolean).join(' · ')

  return (
    <>
      {/* ── Start / End ─────────────────────── */}
      <BehavCard id="start" icon="▶️" title="Start / End" summary={startSummary}
        open={open.start} onToggle={() => toggle('start')}
      >
        <SelectRow
          label="Autoplay"
          value={b.autoplayMode || 'off'}
          options={[
            { v: 'off', l: 'Off' },
            { v: 'silent-preview', l: 'Silent Preview Loop' },
            { v: 'always', l: 'Always' },
            { v: 'scroll', l: 'When in View' },
            { v: 'desktop', l: 'Desktop Only' },
            { v: 'returning', l: 'Returning Visitors' },
          ]}
          onChange={v => {
            onChange('autoplayMode', v)
            onChange('autoplay', v !== 'off')
          }}
        />
        <TogRow value={b.mutedStart} label="Start Muted" desc="Begin with audio off"
          onChange={v => onChange('mutedStart', v)} />
        <SelectRow
          label="End Behavior"
          value={b.endAction || 'pause-last'}
          options={[
            { v: 'pause-last',     l: 'Pause last frame' },
            { v: 'loop',           l: 'Loop' },
            { v: 'show-thumbnail', l: 'Show Thumbnail' },
            { v: 'show-cta',       l: 'CTA Overlay' },
          ]}
          onChange={v => onChange('endAction', v)}
        />
        <TogRow value={b.resumePlayback} label="Resume Playback" desc="Remember position"
          onChange={v => onChange('resumePlayback', v)} />
      </BehavCard>

      {/* ── Playback Controls ──────────────── */}
      <BehavCard id="playback" icon="🎛️" title="Playback Controls" summary={pbSummary}
        open={open.playback} onToggle={() => toggle('playback')}
      >
        <TogRow value={b.showPlaybar !== false} label="Playbar" desc="Scrubber / progress bar"
          onChange={v => onChange('showPlaybar', v)} />
        <TogRow value={b.captions} label="Captions" desc="CC button on player"
          onChange={v => onChange('captions', v)} />
        {b.captions && (
          <TogRow value={b.captionsDefault} label="On by Default" desc="Show without clicking CC"
            onChange={v => onChange('captionsDefault', v)} />
        )}
        <TogRow value={b.showVolume !== false} label="Volume" desc="Volume control"
          onChange={v => onChange('showVolume', v)} />
        <TogRow value={b.showSettings !== false} label="Settings" desc="Settings gear icon"
          onChange={v => onChange('showSettings', v)} />
        <TogRow value={b.showSpeed !== false} label="Playback Speed" desc="Speed selector"
          onChange={v => onChange('showSpeed', v)} />
        <TogRow value={b.showQuality !== false} label="Quality" desc="Quality selector"
          onChange={v => onChange('showQuality', v)} />
        <TogRow value={b.showFullscreen !== false} label="Fullscreen" desc="Fullscreen button"
          onChange={v => onChange('showFullscreen', v)} />
        <TogRow value={b.chapters} label="Chapter Markers" desc="Dots on progress bar"
          onChange={v => onChange('chapters', v)} />
      </BehavCard>

      {/* ── Other ─────────────────────────── */}
      <BehavCard id="other" icon="⚙️" title="Other" summary={otherSummary}
        open={open.other} onToggle={() => toggle('other')}
      >
        <TogRow value={b.ctaReplayPrevention !== false} label="Smart Replay"
          desc="Skip gates for returning leads" onChange={v => onChange('ctaReplayPrevention', v)} />
        <TogRow value={b.autoPersonalize} label="Auto-Personalize"
          desc="Add viewer name to CTAs & headlines" onChange={v => onChange('autoPersonalize', v)} />
        <TogRow value={b.keyboardShortcuts !== false} label="Keyboard Shortcuts"
          desc="Space, arrows, M for mute" onChange={v => onChange('keyboardShortcuts', v)} />
        <TogRow value={b.mobileFF} label="Mobile Skip" desc="Fast-forward on mobile"
          onChange={v => onChange('mobileFF', v)} />
        <TogRow value={b.badge !== false} label="StreamAgent Badge"
          desc="Powered by StreamAgent" onChange={v => onChange('badge', v)} />
      </BehavCard>
    </>
  )
}
