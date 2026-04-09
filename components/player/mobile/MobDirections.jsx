'use client'
export default function MobDirections({ el }) {
    const p = el.props || {}
    const color = p.bgColor || '#FF6B35'

    function handleDirections() {
        const addr = encodeURIComponent(p.address || '')
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
        const url = isIOS
            ? `maps://maps.apple.com/?daddr=${addr}`
            : `https://www.google.com/maps/dir/?api=1&destination=${addr}`
        window.open(url, '_blank')
    }

    return (
        <button
            onClick={handleDirections}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                borderRadius: 12, padding: '12px 16px',
                border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: `0 4px 20px ${color}55`,
                width: '100%', boxSizing: 'border-box',
            }}
        >
            <span style={{ fontSize: 22 }}>📍</span>
            <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>
                    {p.label || 'Get Directions'}
                </div>
                {p.subtitle && (
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{p.subtitle}</div>
                )}
            </div>
        </button>
    )
}