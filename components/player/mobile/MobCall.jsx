'use client'
export default function MobCall({ el }) {
    const p = el.props || {}
    const color = p.bgColor || '#1ED8A0'

    return (
        <a
            href={`tel:${p.phone}`}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                borderRadius: 12, padding: '12px 16px',
                textDecoration: 'none', color: '#fff',
                boxShadow: `0 4px 20px ${color}55`,
                width: '100%', boxSizing: 'border-box',
            }}
        >
            <span style={{ fontSize: 22 }}>📞</span>
            <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>
                    {p.label || 'Call Now'}
                </div>
                {p.subtitle && (
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{p.subtitle}</div>
                )}
            </div>
        </a>
    )
}