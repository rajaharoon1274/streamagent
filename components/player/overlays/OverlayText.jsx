export default function OverlayText({ el }) {
    const p = el.props || {}
    return (
        <div style={{
            width: '100%', height: '100%',
            background: p.background || 'rgba(0,0,0,0.55)',
            borderRadius: 8,
            display: 'flex',
            alignItems: p.vAlign === 'top' ? 'flex-start' : p.vAlign === 'bottom' ? 'flex-end' : 'center',
            justifyContent: p.align === 'left' ? 'flex-start' : p.align === 'right' ? 'flex-end' : 'center',
            padding: '8px 14px',
            boxSizing: 'border-box',
        }}>
            <span style={{
                fontSize: p.fontSize || 18,
                fontWeight: p.fontWeight || 700,
                color: p.color || '#EEF2FF',
                lineHeight: 1.3,
                textAlign: p.align || 'center',
                wordBreak: 'break-word',
            }}>
                {p.text || 'Your text here'}
            </span>
        </div>
    )
}