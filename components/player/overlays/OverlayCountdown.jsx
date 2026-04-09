'use client'
import { useState, useEffect, useRef } from 'react'

export default function OverlayCountdown({ el }) {
    const p = el.props || {}
    const color = p.color || '#F5A623'
    const totalSeconds = (p.minutes || 0) * 60 + (p.seconds || 30)
    const [remaining, setRemaining] = useState(totalSeconds)
    const intervalRef = useRef(null)

    useEffect(() => {
        setRemaining(totalSeconds)
        intervalRef.current = setInterval(() => {
            setRemaining(r => {
                if (r <= 1) { clearInterval(intervalRef.current); return 0 }
                return r - 1
            })
        }, 1000)
        return () => clearInterval(intervalRef.current)
    }, [totalSeconds])

    const m = String(Math.floor(remaining / 60)).padStart(2, '0')
    const s = String(remaining % 60).padStart(2, '0')
    const pct = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0

    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'rgba(10,13,24,0.92)',
            border: `1px solid ${color}33`,
            borderRadius: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 14px',
            boxSizing: 'border-box',
            backdropFilter: 'blur(8px)',
        }}>
            <div style={{
                fontSize: 10, fontWeight: 600, color,
                textTransform: 'uppercase', letterSpacing: '.6px',
            }}>
                {p.label || 'Offer ends in'}
            </div>
            <div style={{
                fontFamily: 'monospace', fontSize: 28,
                fontWeight: 800, color,
                letterSpacing: '2px',
            }}>
                {m}:{s}
            </div>
            {/* Progress bar */}
            <div style={{
                width: '80%', height: 3, background: `${color}22`,
                borderRadius: 4, overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%', width: `${pct}%`,
                    background: color,
                    transition: 'width 1s linear',
                    borderRadius: 4,
                }} />
            </div>
            {p.subtext && (
                <div style={{ fontSize: 9, color: `${color}88` }}>{p.subtext}</div>
            )}
        </div>
    )
}