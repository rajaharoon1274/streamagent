'use client'
export default function MobVcard({ el }) {
    const p = el.props || {}
    const color = p.bgColor || '#A855F7'

    function handleDownload() {
        const vcard = [
            'BEGIN:VCARD', 'VERSION:3.0',
            `FN:${p.name || ''}`,
            p.phone ? `TEL:${p.phone}` : '',
            p.email ? `EMAIL:${p.email}` : '',
            p.company ? `ORG:${p.company}` : '',
            p.title ? `TITLE:${p.title}` : '',
            'END:VCARD',
        ].filter(Boolean).join('\n')

        const blob = new Blob([vcard], { type: 'text/vcard' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${p.name || 'contact'}.vcf`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <button
            onClick={handleDownload}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                borderRadius: 12, padding: '12px 16px',
                border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: `0 4px 20px ${color}55`,
                width: '100%', boxSizing: 'border-box',
            }}
        >
            <span style={{ fontSize: 22 }}>👤</span>
            <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>
                    {p.label || 'Save My Contact'}
                </div>
                {p.name && (
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{p.name}</div>
                )}
            </div>
        </button>
    )
}