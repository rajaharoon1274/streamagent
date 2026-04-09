'use client'
export default function MobSms({ el }) {
    const p = el.props || {}
    const color = p.bgColor || '#4F6EF7'
    const href = `sms:${p.phone}${p.message ? `?body=${encodeURIComponent(p.message)}` : ''}`

    return (
        <a
            href={href}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                borderRadius: 12, padding: '12px 16px',
                textDecoration: 'none', color: '#fff',
                boxShadow: `0 4px 20px ${color}55`,
                width: '100%', boxSizing: 'border-box',
            }}
        >
            <span style={{ fontSize: 22 }}>💬</span>
            <div style={{ fontSize: 14, fontWeight: 800 }}>
                {p.label || 'Text Us'}
            </div>
        </a>
    )
}