'use client'
// app/(public)/watch/[id]/WatchClient.jsx
import { useState, useRef, useCallback, useEffect } from 'react'
import VideoPlayer from '@/components/player/VideoPlayer'
import PlayerOverlay from '@/components/player/PlayerOverlay'
import { resolveViewerIdentity } from '@/lib/viewerIdentity'

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ video, videoId, onGranted }) {
    const [pw, setPw] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function submit(e) {
        e.preventDefault()
        if (!pw.trim()) return
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`/api/player/${videoId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pw }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Incorrect password')
                setLoading(false)
                return
            }

            // Store grant in sessionStorage so refresh doesn't re-lock
            sessionStorage.setItem(`video_grant_${videoId}`, 'true')
            onGranted()
        } catch {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    const lp = video.landing_page || {}
    const accent = video.branding?.primaryColor || lp.brand || '#4F6EF7'

    return (
        <div style={{
            minHeight: '100vh',
            background: lp.bg || '#0F172A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px 16px',
        }}>
            <div style={{
                width: '100%', maxWidth: 400,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '40px 32px',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                    {video.password_headline || 'This video is password protected'}
                </h2>
                {video.password_hint && (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
                        {video.password_hint}
                    </p>
                )}
                <form onSubmit={submit}>
                    <input
                        type="password"
                        value={pw}
                        onChange={e => { setPw(e.target.value); setError('') }}
                        placeholder="Enter password"
                        style={{
                            width: '100%', padding: '12px 14px', borderRadius: 9,
                            background: 'rgba(255,255,255,0.06)',
                            border: `1px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
                            color: '#fff', fontSize: 14, marginBottom: 8, boxSizing: 'border-box',
                            outline: 'none',
                        }}
                    />
                    {error && (
                        <p style={{ fontSize: 11, color: '#EF4444', marginBottom: 10, textAlign: 'left' }}>
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={loading || !pw.trim()}
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
    const { video, elements = [], workspace } = data
    const lp = video.landing_page || {}
    const branding = video.branding || {}
    const accent = branding.primaryColor || lp.brand || '#4F6EF7'
    const font = lp.font || branding.fontFamily || 'Inter'
    // Check sessionStorage for existing password grant
    const [granted, setGranted] = useState(false)
    const [grantChecked, setGrantChecked] = useState(false)
    const viewerIdentityRef = useRef(null)

    useEffect(() => {
        viewerIdentityRef.current = resolveViewerIdentity()
        const { lid, email } = viewerIdentityRef.current

        console.log('[WatchClient] viewer identity:', { lid, email })
        // If we have either lid or email cookie → track this visit
        if (lid || email) {
            fetch('/api/leads/track-visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspace_id: workspace?.id,
                    video_id: video.id,
                    lid,
                    email,
                    source_url: window.location.href,
                }),
            }).catch(() => { }) // silent — non-blocking
        }
    }, [])



    useEffect(() => {
        const hasGrant = sessionStorage.getItem(`video_grant_${videoId}`) === 'true'
        if (!video.requires_password || hasGrant) {
            setGranted(true)
        }
        setGrantChecked(true)
    }, [video.requires_password, videoId])

    // Time tracking — stored in ref for performance
    const currentTimeRef = useRef(0)
    const containerRef = useRef(null)
    const playerRef = useRef(null)
    const handleTimeUpdate = useCallback((t) => {
        currentTimeRef.current = t
    }, [])

    // ── Bandwidth gated ────────────────────────────────────────────────────────
    if (workspace?.bandwidth_gated) {
        return (
            <div style={{
                minHeight: '100vh', background: '#0F172A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24, fontFamily: `'${font}', sans-serif`,
            }}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                    <h2 style={{ marginBottom: 8 }}>Video temporarily unavailable</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>This video has exceeded its bandwidth limit.</p>
                </div>
            </div>
        )
    }

    // Wait until client has checked sessionStorage
    if (!grantChecked) {
        return (
            <div style={{
                minHeight: '100vh', background: lp.bg || '#0F172A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderTop: '2px solid #4F6EF7',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        )
    }

    if (!granted) {
        return <PasswordGate video={video} videoId={videoId} onGranted={() => setGranted(true)} />
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: lp.bg || '#0F172A',
            fontFamily: `'${font}', sans-serif`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 16px',
        }}>

            {/* ── Logo ── */}
            {lp.showLogo !== false && (lp.logoUrl || lp.logoText) && (
                <div style={{ marginBottom: 24 }}>
                    {lp.logoUrl
                        ? <img src={lp.logoUrl} alt="Logo" style={{ height: 40, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 20, fontWeight: 800, color: accent }}>{lp.logoText}</span>
                    }
                </div>
            )}

            {/* ── Headline ── */}
            {lp.showHeadline !== false && (lp.headline || video.title) && (
                <h1 style={{
                    fontSize: 'clamp(22px, 4vw, 38px)',
                    fontWeight: 800, color: '#fff',
                    textAlign: 'center', marginBottom: 10,
                    maxWidth: 720, lineHeight: 1.2,
                }}>
                    {lp.headline || video.title}
                </h1>
            )}

            {/* ── Subheadline ── */}
            {lp.subheadline && lp.subheadline !== `http://localhost:3000/watch/${videoId}` && (
                <p style={{
                    fontSize: 16, color: 'rgba(255,255,255,0.55)',
                    textAlign: 'center', marginBottom: 24,
                    maxWidth: 560, lineHeight: 1.6,
                }}>
                    {lp.subheadline}
                </p>
            )}

            {/* ── Video Player ── */}
            {lp.showVideo !== false && (
                <div
                    ref={containerRef}
                    style={{ width: '100%', maxWidth: 900, marginBottom: 28, position: 'relative' }}
                >
                    <VideoPlayer
                        ref={playerRef}
                        streamUid={video.stream_uid}
                        aspectRatio={video.aspect_ratio || '16:9'}
                        branding={{
                            primaryColor: accent,
                            fontFamily: font,
                            logoUrl: branding.logoUrl || '',
                            logoText: branding.logoText || '',
                            showLogo: branding.showLogo ?? false, // logo inside player handled separately
                            playerMode: branding.playerMode || 'standard',
                            bgColor: '#000',
                        }}
                        onTimeUpdate={handleTimeUpdate}
                    >
                        {/* Element overlays */}
                        <PlayerOverlay
                            elements={elements}
                            currentTimeRef={currentTimeRef}
                            containerRef={containerRef}
                            videoId={video.id}
                            workspaceId={workspace?.id || video.workspace_id}
                            playerRef={playerRef}
                            viewerIdentityRef={viewerIdentityRef}
                        />
                    </VideoPlayer>
                </div>
            )}

            {/* ── Body text ── */}
            {lp.showBody && lp.body && (
                <p style={{
                    fontSize: 15, color: 'rgba(255,255,255,0.5)',
                    textAlign: 'center', maxWidth: 560,
                    lineHeight: 1.7, marginBottom: 24,
                }}>
                    {lp.body}
                </p>
            )}

            {/* ── CTA Button ── */}
            {lp.showCTA && lp.ctaText && (
                <a
                    href={lp.ctaUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-block', padding: '14px 32px',
                        borderRadius: 10, background: accent,
                        color: '#fff', fontSize: 15, fontWeight: 700,
                        textDecoration: 'none', marginBottom: 24,
                        boxShadow: `0 4px 20px ${accent}44`,
                    }}
                >
                    {lp.ctaText}
                </a>
            )}

            {/* ── Powered by ── */}
            {lp.showPowered && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 32 }}>
                    Powered by StreamAgent
                </div>
            )}

        </div>
    )
}