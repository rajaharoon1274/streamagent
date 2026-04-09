'use client'
import {
    useRef, useEffect, useState, useCallback,
    forwardRef, useImperativeHandle
} from 'react'

const AR_PAD = { '16:9': '56.25%', '9:16': '177.78%', '1:1': '100%', '4:5': '125%' }
const AR_MAX = { '9:16': '360px', '1:1': '540px' }
const FONTS = ['Inter', 'Outfit', 'Poppins', 'Roboto', 'Lato', 'Montserrat', 'Open Sans', 'Raleway']

function loadFont(family) {
    if (!family || !FONTS.includes(family)) return
    const id = `gfont-${family.replace(/\s+/g, '-')}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700;800&display=swap`
    document.head.appendChild(link)
}

function loadStreamSDK() {
    return new Promise((resolve) => {
        if (window.Stream) { resolve(window.Stream); return }
        const existing = document.getElementById('cf-stream-sdk')
        if (existing) {
            existing.addEventListener('load', () => resolve(window.Stream))
            return
        }
        const script = document.createElement('script')
        script.id = 'cf-stream-sdk'
        script.src = 'https://embed.cloudflarestream.com/embed/sdk.latest.js'
        script.onload = () => resolve(window.Stream)
        document.head.appendChild(script)
    })
}

const VideoPlayer = forwardRef(function VideoPlayer({
    streamUid,
    aspectRatio = '16:9',
    autoplay = false,
    branding = {},
    onTimeUpdate,
    onReady,
    children,
    embedMode = false,
}, ref) {

    const iframeRef = useRef(null)
    const sdkPlayerRef = useRef(null)
    const [playerReady, setPlayerReady] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const controlsTimer = useRef(null)

    // Branding
    const accentColor = branding?.primaryColor || '#4F6EF7'
    const fontFamily = branding?.fontFamily || 'Inter'
    const logoUrl = branding?.logoUrl || ''
    const logoText = branding?.logoText || ''
    const showLogo = branding?.showLogo ?? true
    const playerMode = branding?.playerMode || 'standard'
    const bgColor = branding?.bgColor || '#000'
    const paddingTop = AR_PAD[aspectRatio] || '56.25%'
    const maxWidth = AR_MAX[aspectRatio] || '100%'

    useEffect(() => { loadFont(fontFamily) }, [fontFamily])

    // ── Re-initialize SDK every time streamUid changes ────────────────────────
    useEffect(() => {
        if (!streamUid) return
        let destroyed = false

        // ── Reset ready state for new video ───────────────────────────────────
        setPlayerReady(false)

        // ── Destroy previous SDK instance ───��─────────────────────────────────
        if (sdkPlayerRef.current) {
            try { sdkPlayerRef.current.destroy?.() } catch { }
            sdkPlayerRef.current = null
        }

        // ── Small delay — let iframe finish loading new src ───────────────────
        const initTimer = setTimeout(() => {
            loadStreamSDK().then((StreamSDK) => {
                if (destroyed || !iframeRef.current || !StreamSDK) return

                const player = StreamSDK(iframeRef.current)
                sdkPlayerRef.current = player

                player.addEventListener('loadeddata', () => {
                    if (destroyed) return
                    setPlayerReady(true)
                    onReady?.()
                    console.log('[VideoPlayer] Ready')
                })

                player.addEventListener('timeupdate', () => {
                    if (destroyed) return
                    onTimeUpdate?.(player.currentTime ?? 0)
                })

                player.addEventListener('play', () => console.log('[VideoPlayer] Playing'))
                player.addEventListener('ended', () => console.log('[VideoPlayer] Ended'))
            })
        }, 300) // ← wait 300ms for iframe src to settle

        return () => {
            destroyed = true
            clearTimeout(initTimer)
            try { sdkPlayerRef.current?.destroy?.() } catch { }
            sdkPlayerRef.current = null
        }
    }, [streamUid]) // ← re-runs every time streamUid changes ✅

    // ── Expose pause/play/getCurrentTime to parent ────────────────────────────
    useImperativeHandle(ref, () => ({
        pause() {
            try { sdkPlayerRef.current?.pause() } catch { }
        },
        play() {
            try { sdkPlayerRef.current?.play() } catch { }
        },
        getCurrentTime() {
            return sdkPlayerRef.current?.currentTime ?? 0
        },
    }), [])

    // ── Controls auto-hide ────────────────────────────────────────────────────
    const resetControlsTimer = useCallback(() => {
        setShowControls(true)
        clearTimeout(controlsTimer.current)
        controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
    }, [])

    useEffect(() => {
        resetControlsTimer()
        return () => clearTimeout(controlsTimer.current)
    }, [resetControlsTimer])

    const containerStyles = {
        standard: { borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' },
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

    const params = [
        autoplay ? 'autoplay=true' : null,
        embedMode ? 'muted=true' : null,
        'preload=auto',
    ].filter(Boolean).join('&')

    const iframeSrc = `https://iframe.cloudflarestream.com/${streamUid}?${params}`

    return (
        <div
            onMouseMove={resetControlsTimer}
            onTouchStart={resetControlsTimer}
            style={{
                width: '100%', maxWidth,
                margin: '0 auto',
                fontFamily: `'${fontFamily}', sans-serif`,
                position: 'relative',
            }}
        >
            {/* Accent bar */}
            {playerMode !== 'borderless' && (
                <div style={{
                    height: 3, background: accentColor,
                    borderRadius: `${modeStyle.borderRadius}px ${modeStyle.borderRadius}px 0 0`,
                    opacity: showControls ? 1 : 0.4,
                    transition: 'opacity 0.3s',
                }} />
            )}

            {/* Video container */}
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
                    key={streamUid}           // ← FORCES full remount on uid change
                    ref={iframeRef}
                    src={iframeSrc}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        border: 'none', display: 'block',
                    }}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="StreamAgent Video Player"
                />

                {/* Logo overlay */}
                {showLogo && (logoUrl || logoText) && (
                    <div style={{
                        position: 'absolute', top: 12, left: 12,
                        zIndex: 10, pointerEvents: 'none',
                        opacity: showControls ? 1 : 0,
                        transition: 'opacity 0.3s',
                    }}>
                        {logoUrl
                            ? <img src={logoUrl} alt="Logo" style={{ height: 28, objectFit: 'contain', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))' }} />
                            : <span style={{
                                fontSize: 13, fontWeight: 800, color: '#fff',
                                textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                                background: `${accentColor}cc`,
                                padding: '3px 8px', borderRadius: 5,
                            }}>{logoText}</span>
                        }
                    </div>
                )}

                {/* Overlays slot */}
                {children && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        zIndex: 20, pointerEvents: 'none',
                    }}>
                        {children}
                    </div>
                )}

                {/* Loading shimmer */}
                {!playerReady && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg,#0e1428,#080f20)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 5,
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

            <style>{`@keyframes vp-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
})

export default VideoPlayer