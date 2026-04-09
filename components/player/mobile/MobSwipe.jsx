'use client'
import { useState } from 'react'

export default function MobSwipe({ el }) {
    const p = el.props || {}
    const color = p.bgColor || '#FF6B6B'
    const [tapped, setTapped] = useState(false)

    function handleTap() {
        setTapped(true)
        if (p.url) window.open(p.url, '_blank', 'noopener,noreferrer')
    }

    return (
        <button
            onClick={handleTap}
            style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4,
                background: 'rgba(0,0,0,0.6)',
                borderRadius: 12, padding: '10px 20px',
                border: `1px solid ${color}55`,
                color: '#fff', cursor: 'pointer',
                animation: tapped ? 'none' : 'swipe-pulse 1.5s ease-in-out infinite',
                width: '100%', boxSizing: 'border-box',
            }}
        >
            <span style={{
                fontSize: 20,
                animation: tapped ? 'none' : 'swipe-arrow 1.2s ease-in-out infinite',
            }}>
                👆
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color, letterSpacing: '0.5px' }}>
                {p.label || 'Swipe Up to Learn More'}
            </span>
            <style>{`
                @keyframes swipe-arrow {
                    0%,100% { transform: translateY(0); }
                    50%     { transform: translateY(-5px); }
                }
                @keyframes swipe-pulse {
                    0%,100% { box-shadow: 0 0 0 0 ${color}44; }
                    50%     { box-shadow: 0 0 0 8px transparent; }
                }
            `}</style>
        </button>
    )
}