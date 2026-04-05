'use client'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

const SECTIONS = [
  { key: 'showLogo',     icon: '⚡', color: '#4F6EF7', label: 'Logo',       desc: 'Brand logo at top' },
  { key: 'showHero',     icon: '🖼', color: '#06B6D4', label: 'Hero Image', desc: 'Full-width image' },
  { key: 'showHeadline', icon: '💬', color: '#A855F7', label: 'Headline',   desc: 'Main headline text' },
  { key: 'showVideo',    icon: '▶',  color: '#1ED8A0', label: 'Video',      desc: 'The video player' },
  { key: 'showBody',     icon: '📄', color: '#06B6D4', label: 'Body Text',  desc: 'Supporting text' },
  { key: 'showCTA',      icon: '👉', color: '#F5A623', label: 'CTA Button', desc: 'Call-to-action' },
  { key: 'showComments', icon: '💬', color: '#1ED8A0', label: 'Comments',   desc: 'Viewer comments' },
  { key: 'showPowered',  icon: '⚡', color: '#6B7280', label: 'Powered By', desc: 'StreamAgent badge' },
]

export default function PageSectionsSection({ lp, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {SECTIONS.map((s, i) => {
        const on = lp[s.key] !== false
        const isLast = i === SECTIONS.length - 1
        return (
          <div
            key={s.key}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 2px',
              borderBottom: isLast ? 'none' : '1px solid var(--b1)',
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: s.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: on ? 'var(--t1)' : 'var(--t3)' }}>{s.label}</div>
              <div style={{ fontSize: 9, color: 'var(--t3)' }}>{s.desc}</div>
            </div>
            <ToggleSwitch
              value={on}
              onChange={v => {
                // Logo and Hero Image are mutually exclusive
                if (s.key === 'showHero' && v) onChange('showLogo', false)
                if (s.key === 'showLogo' && v) onChange('showHero', false)
                onChange(s.key, v)
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
