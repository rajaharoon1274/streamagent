'use client'
export default function MobScreenshot({ el }) {
    const p = el.props || {}
    const bg = p.bgColor || '#0F172A'
    const accent = p.accentColor || '#F06292'

    return (
        <div style={{
            background: bg,
            border: `2px solid ${accent}`,
            borderRadius: 16,
            padding: '20px 18px',
            textAlign: 'center',
            boxShadow: `0 0 0 4px ${accent}22, 0 8px 32px rgba(0,0,0,0.6)`,
            width: '100%', boxSizing: 'border-box',
            position: 'relative',
        }}>
            {/* Screenshot badge */}
            <div style={{
                position: 'absolute', top: -10, left: '50%',
                transform: 'translateX(-50%)',
                background: accent, borderRadius: 20,
                padding: '3px 12px',
                fontSize: 10, fontWeight: 700, color: '#fff',
                whiteSpace: 'nowrap',
            }}>
                📸 Screenshot this!
            </div>

            <p style={{
                fontSize: 13, fontWeight: 800, color: accent,
                margin: '8px 0 10px', textTransform: 'uppercase',
                letterSpacing: '0.5px',
            }}>
                {p.headline || 'Save This Info'}
            </p>
            {p.line1 && (
                <p style={{ fontSize: 13, color: '#EEF2FF', margin: '0 0 6px' }}>
                    {p.line1}
                </p>
            )}
            {p.line2 && (
                <p style={{ fontSize: 13, color: '#EEF2FF', margin: '0 0 6px' }}>
                    {p.line2}
                </p>
            )}
            {p.phone && (
                <p style={{
                    fontSize: 18, fontWeight: 900, color: accent, margin: '10px 0 0',
                    letterSpacing: '1px',
                }}>
                    📞 {p.phone}
                </p>
            )}
        </div>
    )
}