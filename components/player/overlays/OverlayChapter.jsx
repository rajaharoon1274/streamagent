export default function OverlayChapter({ el }) {
    const p = el.props || {}
    const color = p.color || '#1ED8A0'
    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'rgba(10,13,24,0.88)',
            borderLeft: `3px solid ${color}`,
            padding: '10px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            borderRadius: '0 8px 8px 0',
            backdropFilter: 'blur(8px)',
            boxSizing: 'border-box',
        }}>
            <div style={{
                fontSize: 9, fontWeight: 700, color,
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3,
            }}>
                {p.chapter || 'Chapter 1'}
            </div>
            <div style={{
                fontSize: 15, fontWeight: 800, color: '#EEF2FF',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {p.title || 'Introduction'}
            </div>
            {p.description && (
                <div style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.45)',
                    marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {p.description}
                </div>
            )}
        </div>
    )
}