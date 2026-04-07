'use client'
import { useRef, useEffect, useState, useCallback } from 'react'

// ── Aspect ratio map ──────────────────────────────────────────────────────────
const AR_PAD = { '16:9': '56.25%', '9:16': '177.78%', '1:1': '100%', '4:5': '125%' }
const AR_MAX = { '9:16': '360px', '1:1': '540px' }

// ── Font loader ───────────────────────────────────────────────────────────────
const FONTS = ['Inter', 'Outfit', 'Poppins', 'Roboto', 'Lato', 'Montserrat', 'Open Sans', 'Raleway']
function loadFont(family) {
    if (!family || !FONTS.includes(family)) return
    const id = `gfont-${family.replace(/\s+/g, '-')}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700;800&display=swap`
    document.head.appendChild(link)
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VideoPlayer({
    streamUid,
    aspectRatio = '16:9',
    autoplay = false,
    branding = {},
    duration = 0,
    onTimeUpdate,       // callback(currentTime: number)
    onReady,            // callback()
    children,           // overlay elements rendered on top
    embedMode = false,
}) {
    const iframeRef = useRef(null)
    const rafRef = useRef(null)
    const currentTimeRef = useRef(0)        // ← store in ref, NOT state (performance)
    const lastPollRef = useRef(0)
    const [playerReady, setPlayerReady] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const controlsTimer = useRef(null)

    // Derived branding values with safe fallbacks
    const accentColor = branding?.primaryColor || branding?.color || '#4F6EF7'
    const fontFamily = branding?.fontFamily || 'Inter'
    const logoUrl = branding?.logoUrl || ''
    const logoText = branding?.logoText || ''
    const showLogo = branding?.showLogo ?? true
    const playerMode = branding?.playerMode || 'standard'   // standard | minimal | borderless
    const bgColor = branding?.bgColor || '#000'

    const paddingTop = AR_PAD[aspectRatio] || '56.25%'
    const maxWidth = AR_MAX[aspectRatio] || '100%'

    // ── Load Google Font ────────────────────────────────────────────────────────
    useEffect(() => { loadFont(fontFamily) }, [fontFamily])

    // ── Time tracking loop (~200ms via requestAnimationFrame) ──────────────────
    // We use postMessage to query Cloudflare Stream's iframe API
    useEffect(() => {
        if (!playerReady) return
        console.log('[VideoPlayer] Starting time tracking loop')
        let active = true

        function poll(timestamp) {
            if (!active) return

            // Fire every ~200ms
            if (timestamp - lastPollRef.current >= 200) {
                lastPollRef.current = timestamp

                // Ask Cloudflare Stream iframe for currentTime
                iframeRef.current?.contentWindow?.postMessage(
                    JSON.stringify({ event: 'listening' }),
                    '*'
                )
            }

            rafRef.current = requestAnimationFrame(poll)
        }

        rafRef.current = requestAnimationFrame(poll)

        // Listen for messages back from the iframe
        function handleMessage(e) {
            try {
                const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
                if (!data) return

                // ── Cloudflare Stream uses __privateUnstableMessageType format ──
                if (data.__privateUnstableMessageType === 'propertyChange') {
                    if (data.property === 'currentTime' && data.value !== undefined) {
                        currentTimeRef.current = data.value
                        onTimeUpdate?.(data.value)
                        console.log('[TimeTracker] currentTime:', data.value.toFixed(2))
                    }
                    return
                }

                // ── Also handle paused/ended events if needed later ──
                if (data.__privateUnstableMessageType === 'event') {
                    if (data.eventName === 'playing' || data.eventName === 'play') {
                        console.log('[VideoPlayer] Video playing')
                    }
                    if (data.eventName === 'ended') {
                        console.log('[VideoPlayer] Video ended')
                    }
                    return
                }

                // ── Legacy cloudflare-stream source format (fallback) ──
                if (data.source === 'cloudflare-stream') {
                    if (data.currentTime !== undefined) {
                        currentTimeRef.current = data.currentTime
                        onTimeUpdate?.(data.currentTime)
                        console.log('[TimeTracker] currentTime:', data.currentTime.toFixed(2))
                    }
                    if (data.event === 'ready') {
                        setPlayerReady(true)
                        onReady?.()
                    }
                }

            } catch { }
        }

        window.addEventListener('message', handleMessage)
        return () => {
            active = false
            cancelAnimationFrame(rafRef.current)
            window.removeEventListener('message', handleMessage)
        }
    }, [playerReady, onTimeUpdate, onReady])

    // ── Controls auto-hide ──────────────────────────────────────────────────────
    const resetControlsTimer = useCallback(() => {
        setShowControls(true)
        clearTimeout(controlsTimer.current)
        controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
    }, [])

    useEffect(() => {
        resetControlsTimer()
        return () => clearTimeout(controlsTimer.current)
    }, [resetControlsTimer])

    // ── Player mode styles ──────────────────────────────────────────────────────
    const containerStyles = {
        standard: { borderRadius: 12, boxShadow: `0 24px 64px rgba(0,0,0,0.5)` },
        minimal: { borderRadius: 6, boxShadow: 'none' },
        borderless: { borderRadius: 0, boxShadow: 'none' },
    }
    const modeStyle = containerStyles[playerMode] || containerStyles.standard

    if (!streamUid) {
        return (
            <div style={{
                padding: '60px 20px', textAlign: 'center',
                background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                    Video not available
                </div>
            </div>
        )
    }

    // Build iframe src with Cloudflare Stream params
    const iframeSrc = [
        `https://iframe.cloudflarestream.com/${streamUid}`,
        [
            autoplay ? 'autoplay=true' : null,
            'preload=auto',
            embedMode ? 'muted=true' : null,
        ].filter(Boolean).join('&'),
    ].filter(Boolean).join('?')

    return (
        <div
            onMouseMove={resetControlsTimer}
            onTouchStart={resetControlsTimer}
            style={{
                width: '100%',
                maxWidth,
                margin: '0 auto',
                fontFamily: `'${fontFamily}', sans-serif`,
                position: 'relative',
            }}
        >
            {/* ── Accent color bar (top) ── */}
            {playerMode !== 'borderless' && (
                <div style={{
                    height: 3,
                    background: accentColor,
                    borderRadius: `${modeStyle.borderRadius}px ${modeStyle.borderRadius}px 0 0`,
                    transition: 'opacity 0.3s',
                    opacity: showControls ? 1 : 0.4,
                }} />
            )}

            {/* ── Video container ── */}
            <div style={{
                position: 'relative',
                paddingTop,
                background: bgColor,
                overflow: 'hidden',
                ...modeStyle,
                borderRadius: playerMode !== 'borderless'
                    ? `0 0 ${modeStyle.borderRadius}px ${modeStyle.borderRadius}px`
                    : 0,
            }}>

                {/* Cloudflare Stream iframe */}
                <iframe
                    ref={iframeRef}
                    src={iframeSrc}
                    onLoad={() => setPlayerReady(true)}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        border: 'none',
                        display: 'block',
                    }}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="StreamAgent Video Player"
                />

                {/* ── Logo overlay (top-left) ── */}
                {showLogo && (logoUrl || logoText) && (
                    <div style={{
                        position: 'absolute',
                        top: 12, left: 12,
                        zIndex: 10,
                        pointerEvents: 'none',
                        transition: 'opacity 0.3s',
                        opacity: showControls ? 1 : 0,
                    }}>
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt="Logo"
                                style={{ height: 28, objectFit: 'contain', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))' }}
                            />
                        ) : (
                            <span style={{
                                fontSize: 13, fontWeight: 800, color: '#fff',
                                textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                                background: `${accentColor}cc`,
                                padding: '3px 8px', borderRadius: 5,
                            }}>
                                {logoText}
                            </span>
                        )}
                    </div>
                )}

                {/* ── Element overlays slot ── */}
                {children && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 20,
                        pointerEvents: 'none',
                    }}>
                        {children}
                    </div>
                )}

                {/* ── Loading shimmer ── */}
                {!playerReady && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg,#0e1428,#080f20)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 5,
                    }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            border: `3px solid ${accentColor}33`,
                            borderTop: `3px solid ${accentColor}`,
                            animation: 'vp-spin 0.8s linear infinite',
                        }} />
                    </div>
                )}
            </div>

            <style>{`
        @keyframes vp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}