export default function CtaButton({ el }) {
    const p = el.props || {}
    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                background: p.buttonColor || '#1ED8A0',
                borderRadius: p.borderRadius ?? 9,
                padding: '10px 22px',
                fontSize: p.fontSize || 14,
                fontWeight: 800,
                color: p.textColor || '#fff',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                boxShadow: `0 4px 18px ${p.buttonColor || '#1ED8A0'}55`,
                letterSpacing: '0.2px',
                userSelect: 'none',
            }}>
                {p.text || 'Learn More →'}
            </div>
        </div>
    )
}