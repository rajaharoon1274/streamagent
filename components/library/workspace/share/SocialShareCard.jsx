'use client'

const SOCIAL = [
  { label: 'Facebook',   color: '#1877F2', bg: 'rgba(24,119,242,0.1)',  icon: '📘', getUrl: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { label: 'LinkedIn',   color: '#0A66C2', bg: 'rgba(10,102,194,0.1)',  icon: '💼', getUrl: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { label: 'X / Twitter', color: '#e2e8f0', bg: 'rgba(226,232,240,0.08)', icon: '🐦', getUrl: (u) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}` },
  { label: 'Email',      color: '#F5A623', bg: 'rgba(245,166,35,0.1)',   icon: '✉️', getUrl: (u) => `mailto:?subject=Check+this+out&body=${encodeURIComponent(u)}` },
]

export default function SocialShareCard({ video: v }) {
  const slug   = (v.title || 'video').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://streamagent.io'
  const lpUrl  = `${origin}/v/${slug}`

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 10 }}>Share to Social</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {SOCIAL.map((s) => (
          <a
            key={s.label}
            href={s.getUrl(lpUrl)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 8px', borderRadius: 8, textDecoration: 'none',
              background: s.bg, border: `1px solid ${s.color}33`,
              color: s.color, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={e  => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontSize: 13 }}>{s.icon}</span>
            {s.label}
          </a>
        ))}
      </div>
    </div>
  )
}
