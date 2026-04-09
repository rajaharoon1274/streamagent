export default function StickyBar({ el }) {
    const p = el.props || {}
    return (
        <div style={{
            width: '100%', height: '100%',
            background: p.barBg || 'rgba(7,9,15,0.94)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 7,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px', gap: 10,
            boxSizing: 'border-box',
            backdropFilter: 'blur(10px)',
        }}>
            {p.icon && (
                <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
            )}
            <span style={{
                fontSize: 13, fontWeight: 600, color: p.textColor || '#fff',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {p.text || '🔥 Limited spots remaining'}
            </span>
            {p.buttonText && (
                <div style={{
                    background: p.buttonColor || '#FF6B6B',
                    borderRadius: 6, padding: '7px 14px',
                    fontSize: 11, fontWeight: 800,
                    color: '#fff', whiteSpace: 'nowrap',
                    flexShrink: 0, cursor: 'pointer',
                    boxShadow: `0 2px 10px ${p.buttonColor || '#FF6B6B'}55`,
                }}>
                    {p.buttonText}
                </div>
            )}
        </div>
    )
}