'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import VideoPlayer from '@/components/player/VideoPlayer'
import PlayerOverlay from '@/components/player/PlayerOverlay'
import { resolveViewerIdentity } from '@/lib/viewerIdentity'

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ video, videoId, onGranted }) {
    const [pw, setPw] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const lp = video.landing_page || {}
    const accent = video.branding?.color || lp.brand || '#4F6EF7'   // ← FIXED

    async function submit(e) {
        e.preventDefault()
        if (!pw.trim()) return
        setLoading(true); setError('')
        try {
            const res = await fetch(`/api/player/${videoId}/verify`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pw }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Incorrect password'); setLoading(false); return }
            sessionStorage.setItem(`video_grant_${videoId}`, 'true')
            onGranted()
        } catch {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh', background: lp.bg || '#0F172A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px',
        }}>
            <div style={{
                width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '40px 32px', textAlign: 'center',
            }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                    {video.password_headline || 'This video is password protected'}
                </h2>
                {video.password_hint && (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>{video.password_hint}</p>
                )}
                <form onSubmit={submit}>
                    <input
                        type="password" value={pw}
                        onChange={e => { setPw(e.target.value); setError('') }}
                        placeholder="Enter password"
                        style={{
                            width: '100%', padding: '12px 14px', borderRadius: 9,
                            background: 'rgba(255,255,255,0.06)',
                            border: `1px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
                            color: '#fff', fontSize: 14, marginBottom: 8, boxSizing: 'border-box', outline: 'none',
                        }}
                    />
                    {error && <p style={{ fontSize: 11, color: '#EF4444', marginBottom: 10, textAlign: 'left' }}>{error}</p>}
                    <button
                        type="submit" disabled={loading || !pw.trim()}
                        style={{
                            width: '100%', padding: '12px', borderRadius: 9,
                            background: loading ? 'rgba(255,255,255,0.1)' : accent,
                            border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? 'Verifying…' : 'Watch Video'}
                    </button>
                </form>
            </div>
        </div>
    )
}

// ── Main Watch Client ─────────────────────────────────────────────────────────
export default function WatchClient({ data, videoId }) {
    const { video, elements: initialElements = [], workspace } = data
    const lp = video.landing_page || {}
    const branding = video.branding || {}

    // ─────────────────────────────────────────────────────────────────────────────
    // CRITICAL FIX: use branding.color — this is the field saved by Day 13 panels.
    // Old code used branding.primaryColor which is NEVER set by any panel.
    // ─────────────────────────────────────────────────────────────────────────────
    const accent = branding.color || lp.brand || '#4F6EF7'
    const font = lp.font || branding.font || 'Inter'

    const [currentStreamUid, setCurrentStreamUid] = useState(video.stream_uid)
    const [currentElements, setCurrentElements] = useState(initialElements)
    const [currentVideoId, setCurrentVideoId] = useState(video.id)
    const [isSwapping, setIsSwapping] = useState(false)
    const [swapCount, setSwapCount] = useState(0)
    const routePathRef = useRef([video.id])
    const autoPlayAfterSwapRef = useRef(false)
    const currentTimeRef = useRef(0)
    const containerRef = useRef(null)
    const playerRef = useRef(null)
    const viewerIdentityRef = useRef(null)

    const handleTimeUpdate = useCallback((t) => { currentTimeRef.current = t }, [])

    const handleReady = useCallback(() => {
        if (autoPlayAfterSwapRef.current) {
            autoPlayAfterSwapRef.current = false
            setTimeout(() => { try { playerRef.current?.play() } catch { } }, 200)
        }
    }, [])

    const handleRouteSwap = useCallback(async (targetVideoId) => {
        if (!targetVideoId || isSwapping) return
        setIsSwapping(true)
        try {
            const res = await fetch(`/api/player/${targetVideoId}`)
            if (!res.ok) throw new Error('Failed to load target video')
            const d = await res.json()
            autoPlayAfterSwapRef.current = true
            setCurrentStreamUid(d.video.stream_uid)
            setCurrentElements(d.elements || [])
            setCurrentVideoId(targetVideoId)
            setSwapCount(c => c + 1)
            const url = new URL(window.location.href)
            url.searchParams.set('route_node', targetVideoId)
            window.history.pushState({}, '', url)
            routePathRef.current = [...routePathRef.current, targetVideoId]
            sessionStorage.setItem(`route_path_${videoId}`, JSON.stringify(routePathRef.current))
        } catch (err) {
            console.error('[WatchClient] Route swap failed:', err)
            autoPlayAfterSwapRef.current = false
        } finally {
            setIsSwapping(false)
        }
    }, [isSwapping, videoId])

    useEffect(() => {
        viewerIdentityRef.current = resolveViewerIdentity()
        const { lid, email } = viewerIdentityRef.current
        if (lid || email) {
            fetch('/api/leads/track-visit', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspace_id: workspace?.id, video_id: video.id,
                    lid, email, source_url: window.location.href,
                }),
            }).catch(() => { })
        }
    }, []) // eslint-disable-line

    const [granted, setGranted] = useState(false)
    const [grantChecked, setGrantChecked] = useState(false)
    useEffect(() => {
        const hasGrant = sessionStorage.getItem(`video_grant_${videoId}`) === 'true'
        if (!video.requires_password || hasGrant) setGranted(true)
        setGrantChecked(true)
    }, [video.requires_password, videoId])

    if (workspace?.bandwidth_gated) {
        return (
            <div style={{
                minHeight: '100vh', background: '#0F172A', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: 24,
                fontFamily: `'${font}', sans-serif`,
            }}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                    <h2 style={{ marginBottom: 8 }}>Video temporarily unavailable</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>This video has exceeded its bandwidth limit.</p>
                </div>
            </div>
        )
    }

    if (!grantChecked) {
        return (
            <div style={{
                minHeight: '100vh', background: lp.bg || '#0F172A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderTop: `2px solid ${accent}`,
                    animation: 'wc-spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes wc-spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        )
    }

    if (!granted) {
        return <PasswordGate video={video} videoId={videoId} onGranted={() => setGranted(true)} />
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CRITICAL FIX: pass the FULL branding object with ALL Day 13 field names.
    // Old code only passed primaryColor/fontFamily/logoUrl — ignoring all other
    // saved fields like playerMode, badge, autoplay, showProgress, etc.
    // ─────────────────────────────────────────────────────────────────────────────
    const playerBranding = {
        color: branding.color || accent,
        textColor: branding.textColor || '#ffffff',
        logoUrl: branding.logoUrl || '',
        logoPosition: branding.logoPosition || 'top-left',
        logoSize: branding.logoSize || 'small',
        logoOpacity: branding.logoOpacity ?? 0.8,
        logoClickUrl: branding.logoClickUrl || '',
        playerMode: branding.playerMode || 'frosted-pill',
        badge: branding.badge !== false,
        autoplay: branding.autoplay === true,
        muted: branding.muted === true || branding.autoplay === true,
        showProgress: branding.showProgress !== false,
        showTime: branding.showTime !== false,
        cornerRadius: branding.cornerRadius ?? 12,
        borderEnabled: branding.borderEnabled === true,
        borderColor: branding.borderColor || 'rgba(255,255,255,0.1)',
        ambientGlow: branding.ambientGlow === true,
        ambientIntensity: branding.ambientIntensity ?? 0.4,
        barStyle: branding.barStyle || 'pill',
        barOpacity: branding.barOpacity ?? 0.85,
        barIconColor: branding.barIconColor || '#ffffff',
        scrubberColor: branding.scrubberColor || branding.color || accent,
        scrubberStyle: branding.scrubberStyle || 'thin',
    }

    return (
        <div style={{
            minHeight: '100vh', background: lp.bg || '#0F172A',
            fontFamily: `'${font}', sans-serif`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px',
        }}>

            {/* Logo */}
            {lp.showLogo !== false && (lp.logoUrl || lp.logoText) && (
                <div style={{ marginBottom: 24 }}>
                    {lp.logoUrl
                        ? <img src={lp.logoUrl} alt="Logo" style={{ height: 40, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 20, fontWeight: 800, color: accent }}>{lp.logoText}</span>
                    }
                </div>
            )}

            {/* Headline */}
            {lp.showHeadline !== false && (lp.headline || video.title) && (
                <h1 style={{
                    fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 800,
                    color: lp.tc || '#fff', textAlign: 'center', marginBottom: 10, maxWidth: 720, lineHeight: 1.2,
                }}>
                    {lp.headline || video.title}
                </h1>
            )}

            {/* Subheadline */}
            {lp.subheadline && !lp.subheadline.startsWith('http') && (
                <p style={{
                    fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center',
                    marginBottom: 24, maxWidth: 560, lineHeight: 1.6,
                }}>
                    {lp.subheadline}
                </p>
            )}

            {/* Video player */}
            {lp.showVideo !== false && (
                <div ref={containerRef} style={{ width: '100%', maxWidth: 900, marginBottom: 28, position: 'relative' }}>
                    {isSwapping && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(7,9,15,0.85)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12,
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%',
                                border: `3px solid ${accent}33`, borderTop: `3px solid ${accent}`,
                                animation: 'wc-spin 0.8s linear infinite',
                            }} />
                        </div>
                    )}

                    <VideoPlayer
                        key={swapCount}
                        ref={playerRef}
                        streamUid={currentStreamUid}
                        aspectRatio={video.aspect_ratio || video.aspectRatio || '16:9'}
                        autoplay={playerBranding.autoplay}
                        muted={playerBranding.muted}
                        branding={playerBranding}
                        onTimeUpdate={handleTimeUpdate}
                        onReady={handleReady}
                    >
                        <PlayerOverlay
                            elements={currentElements}
                            currentTimeRef={currentTimeRef}
                            containerRef={containerRef}
                            videoId={currentVideoId}
                            workspaceId={workspace?.id}
                            playerRef={playerRef}
                            viewerIdentityRef={viewerIdentityRef}
                            onRouteSwap={handleRouteSwap}
                        />
                    </VideoPlayer>
                </div>
            )}

            {/* Body */}
            {lp.showBody && lp.body && (
                <p style={{
                    fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center',
                    maxWidth: 560, lineHeight: 1.7, marginBottom: 24,
                }}>
                    {lp.body}
                </p>
            )}

            {/* CTA */}
            {lp.showCTA && lp.ctaText && (
                <a href={lp.ctaUrl || '#'} target="_blank" rel="noopener noreferrer"
                    style={{
                        display: 'inline-block', padding: '14px 32px', borderRadius: 10,
                        background: accent, color: '#fff', fontSize: 15, fontWeight: 700,
                        textDecoration: 'none', marginBottom: 24, boxShadow: `0 4px 20px ${accent}44`,
                    }}
                >
                    {lp.ctaText} →
                </a>
            )}

            {/* Powered by */}
            {lp.showPowered !== false && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 32 }}>
                    Powered by{' '}
                    <a href="https://streamagent.io" target="_blank" rel="noopener noreferrer"
                        style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>
                        StreamAgent
                    </a>
                </div>
            )}

            <style>{`@keyframes wc-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}