'use client'
import { useState, useEffect, useRef } from 'react'

// ── Which elements are visible at a given time ────────────────────────────────
function getActiveElements(elements, currentTime) {
    return elements.filter(el => {
        const start = el.timing?.in ?? 0
        const dur = el.timing?.duration ?? 5
        return currentTime >= start && currentTime < start + dur
    })
}

// ── Simple element renderer (matches your existing canvas renderer styles) ────
function OverlayElement({ el, videoWidth, videoHeight }) {
    const p = el.props || {}
    const x = ((el.x ?? 10) / 100) * videoWidth
    const y = ((el.y ?? 10) / 100) * videoHeight
    const w = ((el.w ?? 40) / 100) * videoWidth
    const h = ((el.h ?? 25) / 100) * videoHeight

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: w,
                height: h,
                opacity: el.opacity ?? 1,
                zIndex: el.z_index ?? 1,
                pointerEvents: 'auto',
                cursor: p.url ? 'pointer' : 'default',
                borderRadius: 8,
                overflow: 'hidden',
            }}
            onClick={() => {
                if (p.url) window.open(p.url, p.openNewTab !== false ? '_blank' : '_self')
            }}
        >
            <ElementContent el={el} />
        </div>
    )
}

// ── Render element content by type ────────────────────────────────────────────
function ElementContent({ el }) {
    const p = el.props || {}

    switch (el.type) {
        case 'overlay-text':
            return (
                <div style={{
                    width: '100%', height: '100%',
                    background: p.background || 'rgba(0,0,0,0.5)',
                    borderRadius: 7,
                    display: 'flex', alignItems: 'center',
                    justifyContent: p.align === 'left' ? 'flex-start' : 'center',
                    padding: '6px 12px',
                }}>
                    <span style={{
                        fontSize: p.fontSize || 20,
                        fontWeight: 700,
                        color: p.color || '#EEF2FF',
                    }}>
                        {p.text || 'Your text here'}
                    </span>
                </div>
            )

        case 'cta-button':
            return (
                <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: p.buttonColor || '#1ED8A0',
                        borderRadius: 8,
                        padding: '9px 18px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                    }}>
                        {p.text || 'Learn More →'}
                    </div>
                </div>
            )

        case 'overlay-countdown':
            return <CountdownEl p={p} />

        case 'overlay-chapter':
            return (
                <div style={{
                    width: '100%', height: '100%',
                    background: 'rgba(10,13,24,0.88)',
                    borderLeft: `3px solid ${p.color || '#1ED8A0'}`,
                    padding: '9px 14px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    borderRadius: '0 7px 7px 0',
                }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: p.color || '#1ED8A0', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 2 }}>
                        {p.chapter || 'Chapter 1'}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#EEF2FF' }}>
                        {p.title || 'Introduction'}
                    </div>
                </div>
            )

        case 'annotation-link':
            return (
                <div style={{
                    width: '100%', height: '100%',
                    background: 'rgba(7,9,15,0.92)',
                    border: `1px solid ${p.color || '#A855F7'}44`,
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    cursor: 'pointer',
                }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                        background: `${p.color || '#A855F7'}22`,
                        border: `1px solid ${p.color || '#A855F7'}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                        {p.thumbnailEmoji || '🎬'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.title || 'Watch Next'}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{p.sub}</div>
                    </div>
                    <div style={{ fontSize: 14, color: p.color || '#A855F7' }}>›</div>
                </div>
            )

        case 'sticky-bar':
            return (
                <div style={{
                    width: '100%', height: '100%',
                    background: p.barBg || 'rgba(7,9,15,0.92)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 16px', gap: 12,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.text || '🔥 Limited spots'}
                    </span>
                    <div style={{
                        background: p.buttonColor || '#FF6B6B',
                        borderRadius: 7, padding: '8px 16px',
                        fontSize: 11, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', flexShrink: 0,
                        cursor: 'pointer',
                    }}>
                        {p.buttonText || 'Book Now →'}
                    </div>
                </div>
            )

        case 'image-clickable':
            return p.imageUrl ? (
                <div style={{ width: '100%', height: '100%', borderRadius: p.borderRadius || 8, overflow: 'hidden' }}>
                    <img src={p.imageUrl} alt={p.altText || ''} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            ) : null

        default:
            return null
    }
}

// ── Countdown element with live ticking ──────────────────────────────────────
function CountdownEl({ p }) {
    const total = (p.minutes || 10) * 60 + (p.seconds || 0)
    const [remaining, setRemaining] = useState(total)

    useEffect(() => {
        const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000)
        return () => clearInterval(t)
    }, [])

    const m = String(Math.floor(remaining / 60)).padStart(2, '0')
    const s = String(remaining % 60).padStart(2, '0')

    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'rgba(10,13,24,0.9)',
            border: `1px solid ${p.color || '#F5A623'}33`,
            borderRadius: 9,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: p.color || '#F5A623', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                {p.label || 'Offer ends in'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: p.color || '#F5A623' }}>
                {m}:{s}
            </div>
        </div>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PlayerOverlay({ elements = [], currentTimeRef, containerRef }) {
    const [activeEls, setActiveEls] = useState([])
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    // Update dimensions when container resizes
    useEffect(() => {
        if (!containerRef?.current) return
        const obs = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect
            setDimensions({ width, height })
        })
        obs.observe(containerRef.current)
        return () => obs.disconnect()
    }, [containerRef])

    // Poll active elements every ~200ms using currentTimeRef
    useEffect(() => {
        let rafId
        function tick() {
            const t = currentTimeRef?.current ?? 0
            setActiveEls(getActiveElements(elements, t))
            rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafId)
    }, [elements, currentTimeRef])

    if (!dimensions.width) return null

    return (
        <>
            {activeEls.map(el => (
                <OverlayElement
                    key={el.id}
                    el={el}
                    videoWidth={dimensions.width}
                    videoHeight={dimensions.height}
                />
            ))}
        </>
    )
}