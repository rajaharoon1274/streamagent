'use client'
import { useState, useEffect } from 'react'

export default function MobShake({ el }) {
    const p = el.props || {}
    const bg = p.bgColor || '#FFD700'
    const revealBg = p.revealBg || '#1ED8A0'
    const [revealed, setRevealed] = useState(false)
    const [shaking, setShaking] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        let lastTime = 0
        let lastX = 0, lastY = 0, lastZ = 0

        function handleMotion(e) {
            const acc = e.accelerationIncludingGravity
            if (!acc) return
            const now = Date.now()
            if (now - lastTime < 100) return
            lastTime = now

            const dx = Math.abs((acc.x || 0) - lastX)
            const dy = Math.abs((acc.y || 0) - lastY)
            const dz = Math.abs((acc.z || 0) - lastZ)
            lastX = acc.x || 0; lastY = acc.y || 0; lastZ = acc.z || 0

            if (dx + dy + dz > 25) {
                setShaking(true)
                setTimeout(() => setShaking(false), 500)
                setRevealed(true)
            }
        }

        window.addEventListener('devicemotion', handleMotion)
        return () => window.removeEventListener('devicemotion', handleMotion)
    }, [])

    return (
        <div
            onClick={() => setRevealed(true)} // tap fallback
            style={{
                background: revealed ? revealBg : bg,
                borderRadius: 14,
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background 0.4s ease',
                animation: shaking ? 'mob-shake 0.4s ease' : 'none',
                width: '100%', boxSizing: 'border-box',
                boxShadow: `0 4px 20px ${revealed ? revealBg : bg}55`,
            }}
        >
            {revealed ? (
                <div>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>🎉</div>
                    <p style={{
                        fontSize: 15, fontWeight: 900,
                        color: '#fff', margin: 0,
                    }}>
                        {p.hiddenText || 'Use code SAVE20 for 20% off!'}
                    </p>
                </div>
            ) : (
                <div>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>🫨</div>
                    <p style={{
                        fontSize: 13, fontWeight: 700,
                        color: 'rgba(0,0,0,0.7)', margin: 0,
                    }}>
                        {p.promptText || 'Shake your phone for a surprise!'}
                    </p>
                    <p style={{
                        fontSize: 10, color: 'rgba(0,0,0,0.4)',
                        marginTop: 4,
                    }}>
                        (or tap to reveal)
                    </p>
                </div>
            )}
            <style>{`
                @keyframes mob-shake {
                    0%,100% { transform: translateX(0); }
                    20%     { transform: translateX(-6px); }
                    40%     { transform: translateX(6px); }
                    60%     { transform: translateX(-4px); }
                    80%     { transform: translateX(4px); }
                }
            `}</style>
        </div>
    )
}