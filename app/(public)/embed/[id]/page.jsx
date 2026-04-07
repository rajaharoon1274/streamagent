'use client'
// app/(public)/embed/[id]/page.jsx
// iframe-safe — no padding, no landing page chrome, just the player
import { useEffect, useRef, useState } from 'react'
import VideoPlayer from '@/components/player/VideoPlayer'
import PlayerOverlay from '@/components/player/PlayerOverlay'

export default function EmbedPage({ params }) {
    const [data, setData] = useState(null)
    const [error, setError] = useState(false)
    const currentTimeRef = useRef(0)
    const containerRef = useRef(null)

    useEffect(() => {
        fetch(`/api/player/${params.id}`)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setData)
            .catch(() => setError(true))
    }, [params.id])

    if (error) {
        return (
            <div style={{
                width: '100vw', height: '100vh',
                background: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Video unavailable</span>
            </div>
        )
    }

    if (!data) {
        return (
            <div style={{
                width: '100vw', height: '100vh',
                background: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderTop: '2px solid #4F6EF7',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
            </div>
        )
    }

    const { video, elements = [] } = data
    const branding = video.branding || {}
    const accent = branding.primaryColor || video.color || '#4F6EF7'

    return (
        <div style={{
            width: '100vw', height: '100vh',
            background: '#000', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div
                ref={containerRef}
                style={{ width: '100%', height: '100%', position: 'relative' }}
            >
                <VideoPlayer
                    streamUid={video.stream_uid}
                    aspectRatio={video.aspect_ratio || '16:9'}
                    autoplay
                    embedMode
                    branding={{
                        primaryColor: accent,
                        playerMode: 'borderless',
                        showLogo: branding.showLogo ?? false,
                        logoUrl: branding.logoUrl || '',
                        logoText: branding.logoText || '',
                    }}
                    onTimeUpdate={t => { currentTimeRef.current = t }}
                >
                    <PlayerOverlay
                        elements={elements}
                        currentTimeRef={currentTimeRef}
                        containerRef={containerRef}
                    />
                </VideoPlayer>
            </div>
        </div>
    )
}