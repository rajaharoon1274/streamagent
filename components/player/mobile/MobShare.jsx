'use client'
export default function MobShare({ el }) {
    const p = el.props || {}
    const color = p.bgColor || '#06B6D4'

    async function handleShare() {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
        const text = `${p.message || 'Check out this video:'} ${shareUrl}`
        try {
            if (navigator.share) {
                await navigator.share({ title: document.title, text, url: shareUrl })
            } else {
                // Fallback: sms share
                window.open(`sms:?body=${encodeURIComponent(text)}`)
            }
        } catch { }
    }

    return (
        <button
            onClick={handleShare}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                borderRadius: 12, padding: '12px 16px',
                border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: `0 4px 20px ${color}55`,
                width: '100%', boxSizing: 'border-box',
            }}
        >
            <span style={{ fontSize: 22 }}>📤</span>
            <div style={{ fontSize: 14, fontWeight: 800 }}>
                {p.label || 'Share with a Friend'}
            </div>
        </button>
    )
}