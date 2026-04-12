'use client'
import {
    useRef, useEffect, useState, useCallback,
    forwardRef, useImperativeHandle
} from 'react'

const AR_PAD = { '16:9': '56.25%', '9:16': '177.78%', '1:1': '100%', '4:5': '125%' }
const AR_MAX = { '9:16': '360px', '1:1': '540px' }

const PLAYER_MODE_STYLES = {
    'frosted-pill': { borderRadius: 24, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' },
    'full-bar': { borderRadius: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
    'minimal': { borderRadius: 4, boxShadow: 'none' },
    'glass-card': { borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' },
    'cinematic': { borderRadius: 0, boxShadow: '0 32px 80px rgba(0,0,0,0.8)' },
    'neon-edge': { borderRadius: 8, boxShadow: '' },
    'soft-float': { borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' },
    'brand-accent': { borderRadius: 12, boxShadow: '' },
    // legacy aliases
    'standard': { borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' },
    'borderless': { borderRadius: 0, boxShadow: 'none' },
}

const LOGO_POS = {
    'top-left': { top: 12, left: 12 },
    'top-right': { top: 12, right: 12 },
    'bottom-left': { bottom: 44, left: 12 },
    'bottom-right': { bottom: 44, right: 12 },
}

function loadStreamSDK() {
    return new Promise((resolve) => {
        if (window.Stream) { resolve(window.Stream); return }
        const existing = document.getElementById('cf-stream-sdk')
        if (existing) { existing.addEventListener('load', () => resolve(window.Stream)); return }
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
    muted = false,
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

    // ── Branding values — reads branding.color (Day 13 field) ──────────────────
    // Falls back to branding.primaryColor for backward compat with old records
    const accentColor = branding?.color || branding?.primaryColor || '#4F6EF7'
    const logoUrl = branding?.logoUrl || ''
    const logoPosition = branding?.logoPosition || 'top-left'
    const logoSize = branding?.logoSize || 'small'
    const logoOpacity = branding?.logoOpacity ?? 0.8
    const logoClickUrl = branding?.logoClickUrl || ''
    const playerMode = branding?.playerMode || 'frosted-pill'
    const showBadge = branding?.badge !== false
    const isAutoplay = branding?.autoplay === true || autoplay
    const isMuted = isAutoplay || branding?.muted === true || muted

    const LOGO_SZ_MAP = { small: 22, medium: 32, large: 44 }
    const logoH = LOGO_SZ_MAP[logoSize] || 22
    const logoPosStyle = LOGO_POS[logoPosition] || LOGO_POS['top-left']

    const paddingTop = AR_PAD[aspectRatio] || '56.25%'
    const maxWidth = AR_MAX[aspectRatio] || '100%'

    // ── Player mode style ───────────────────────────────────────────────────────
    const modeStyle = (() => {
        const base = PLAYER_MODE_STYLES[playerMode] || PLAYER_MODE_STYLES['frosted-pill']
        if (playerMode === 'neon-edge') return { ...base, boxShadow: `0 0 20px ${accentColor}66, 0 0 60px ${accentColor}22` }
        if (playerMode === 'brand-accent') return { ...base, boxShadow: `0 8px 32px ${accentColor}44` }
        return base
    })()

    const isCinematic = playerMode === 'cinematic'
    const isNeon = playerMode === 'neon-edge'
    const showAccentBar = !['minimal', 'borderless', 'full-bar'].includes(playerMode)

    // ── SDK init ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!streamUid) return
        let destroyed = false
        setPlayerReady(false)
        if (sdkPlayerRef.current) {
            try { sdkPlayerRef.current.destroy?.() } catch { }
            sdkPlayerRef.current = null
        }
        const initTimer = setTimeout(() => {
            loadStreamSDK().then((StreamSDK) => {
                if (destroyed || !iframeRef.current || !StreamSDK) return
                const player = StreamSDK(iframeRef.current)
                sdkPlayerRef.current = player
                player.addEventListener('loadeddata', () => {
                    if (destroyed) return
                    setPlayerReady(true)
                    onReady?.()
                })
                player.addEventListener('timeupdate', () => {
                    if (destroyed) return
                    onTimeUpdate?.(player.currentTime ?? 0)
                })
            })
        }, 300)
        return () => {
            destroyed = true
            clearTimeout(initTimer)
            try { sdkPlayerRef.current?.destroy?.() } catch { }
            sdkPlayerRef.current = null
        }
    }, [streamUid])

    useImperativeHandle(ref, () => ({
        pause() { try { sdkPlayerRef.current?.pause() } catch { } },
        play() { try { sdkPlayerRef.current?.play() } catch { } },
        getCurrentTime() { return sdkPlayerRef.current?.currentTime ?? 0 },
    }), [])

    const resetControlsTimer = useCallback(() => {
        setShowControls(true)
        clearTimeout(controlsTimer.current)
        controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
    }, [])

    useEffect(() => {
        resetControlsTimer()
        return () => clearTimeout(controlsTimer.current)
    }, [resetControlsTimer])

    if (!streamUid) {
        return (
            <div style={{
                padding: '60px 20px', textAlign: 'center',
                background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Video not available</div>
            </div>
        )
    }

    const params = [
        isAutoplay ? 'autoplay=true' : null,
        isMuted ? 'muted=true' : null,
        'preload=auto',
    ].filter(Boolean).join('&')

    const iframeSrc = `https://iframe.cloudflarestream.com/${streamUid}?${params}`

    return (
        <div
            onMouseMove={resetControlsTimer}
            onTouchStart={resetControlsTimer}
            style={{ width: '100%', maxWidth, margin: '0 auto', position: 'relative' }}
        >
            {/* Cinematic top bar */}
            {isCinematic && <div style={{ height: 28, background: '#000' }} />}

            {/* Accent top bar */}
            {showAccentBar && (
                <div style={{
                    height: isNeon ? 2 : 3,
                    background: isNeon
                        ? `linear-gradient(90deg,transparent,${accentColor},transparent)`
                        : accentColor,
                    borderRadius: `${modeStyle.borderRadius || 0}px ${modeStyle.borderRadius || 0}px 0 0`,
                    opacity: showControls ? 1 : 0.4,
                    transition: 'opacity 0.3s',
                }} />
            )}

            {/* Video container */}
            <div style={{
                position: 'relative', paddingTop,
                background: '#000', overflow: 'hidden',
                borderRadius: showAccentBar
                    ? `0 0 ${modeStyle.borderRadius || 0}px ${modeStyle.borderRadius || 0}px`
                    : `${modeStyle.borderRadius || 0}px`,
                boxShadow: modeStyle.boxShadow || 'none',
            }}>

                {/* Cloudflare iframe */}
                <iframe
                    key={streamUid}
                    ref={iframeRef}
                    src={iframeSrc}
                    style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%',
                        border: 'none', display: 'block',
                    }}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="StreamAgent Video Player"
                />

                {/* Logo overlay */}
                {logoUrl && (
                    <div style={{
                        position: 'absolute', ...logoPosStyle, zIndex: 10,
                        opacity: showControls ? logoOpacity : 0,
                        transition: 'opacity 0.3s',
                        pointerEvents: logoClickUrl ? 'auto' : 'none',
                    }}>
                        {logoClickUrl ? (
                            <a href={logoClickUrl} target="_blank" rel="noopener noreferrer">
                                <img src={logoUrl} alt="Logo" style={{ height: logoH, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.7))' }} />
                            </a>
                        ) : (
                            <img src={logoUrl} alt="Logo" style={{ height: logoH, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.7))' }} />
                        )}
                    </div>
                )}

                {/* Powered by StreamAgent badge */}
                {showBadge && (
                    <div style={{
                        position: 'absolute', bottom: 8, right: 8, zIndex: 10,
                        opacity: showControls ? 0.75 : 0, transition: 'opacity 0.3s',
                        pointerEvents: 'none',
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)',
                            padding: '3px 7px', borderRadius: 20,
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            <div style={{
                                width: 10, height: 10, borderRadius: 3, background: accentColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="5" height="5" viewBox="0 0 24 24" fill="#fff">
                                    <polygon points="7,4 21,12 7,20" />
                                </svg>
                            </div>
                            <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', letterSpacing: '0.3px' }}>
                                StreamAgent
                            </span>
                        </div>
                    </div>
                )}

                {/* Brand Accent bottom strip */}
                {playerMode === 'brand-accent' && (
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: 3, background: accentColor, zIndex: 5,
                    }} />
                )}

                {/* Children slot (overlays) */}
                {children && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
                        {children}
                    </div>
                )}

                {/* Loading spinner */}
                {!playerReady && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 5,
                        background: 'linear-gradient(135deg,#0e1428,#080f20)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
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

            {/* Cinematic bottom bar */}
            {isCinematic && <div style={{ height: 28, background: '#000' }} />}

            <style>{`@keyframes vp-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
})

export default VideoPlayer