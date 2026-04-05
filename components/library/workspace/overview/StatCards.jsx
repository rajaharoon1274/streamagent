'use client'
import SparklineChart from '@/components/ui/SparklineChart'

// Matches HTML statCard() exactly:
// background:var(--s2);border:1px solid var(--b2);border-radius:14px;padding:16px 18px
// label top-left, icon top-right in colored circle
// big value, sub-text + sparkline bottom row

function StatCard({ label, value, sub, color, icon }) {
  const icons = {
    eye:  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    play: <polygon points="5,3 19,12 5,21" />,
    zap:  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  }
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{label}</div>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[icon]}
          </svg>
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.5px', marginBottom: 2 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{sub}</div>
        <SparklineChart color={color} />
      </div>
    </div>
  )
}

export default function StatCards({ video: v }) {
  const cards = [
    { label: 'Views',       value: v.views?.toLocaleString() ?? '0', sub: 'This video',     color: '#4F6EF7', icon: 'eye'  },
    { label: 'Plays',       value: v.plays?.toLocaleString() ?? '0', sub: 'Total plays',    color: '#06B6D4', icon: 'play' },
    { label: 'Engagement',  value: `${v.eng ?? 0}%`,                 sub: 'Avg watch depth', color: '#1ED8A0', icon: 'zap'  },
    { label: 'Leads',       value: '—',                              sub: 'From this video', color: '#F5A623', icon: 'mail' },
  ]
  return (
    <div className="lib-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
      {cards.map(c => <StatCard key={c.label} {...c} />)}
    </div>
  )
}
