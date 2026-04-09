export default function ImageClickable({ el }) {
    const p = el.props || {}
    if (!p.imageUrl) return null
    return (
        <div style={{
            width: '100%', height: '100%',
            borderRadius: p.borderRadius ?? 8,
            overflow: 'hidden',
            cursor: p.url ? 'pointer' : 'default',
            boxShadow: p.shadow ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
        }}>
            <img
                src={p.imageUrl}
                alt={p.altText || ''}
                style={{ width: '100%', height: '100%', objectFit: p.objectFit || 'contain', display: 'block' }}
                draggable={false}
            />
        </div>
    )
}