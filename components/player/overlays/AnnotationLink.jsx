export default function AnnotationLink({ el }) {
    const p = el.props || {}
    const color = p.color || '#A855F7'
    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'rgba(7,9,15,0.92)',
            border: `1px solid ${color}33`,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            cursor: p.url ? 'pointer' : 'default',
            boxSizing: 'border-box',
            backdropFilter: 'blur(8px)',
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: `${color}22`,
                border: `1px solid ${color}44`,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20,
            }}>
                {p.thumbnailEmoji || '🎬'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 12, fontWeight: 700, color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', marginBottom: 2,
                }}>
                    {p.title || 'Watch Next'}
                </div>
                {p.sub && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.sub}
                    </div>
                )}
            </div>
            <div style={{ fontSize: 16, color, flexShrink: 0 }}>›</div>
        </div>
    )
}