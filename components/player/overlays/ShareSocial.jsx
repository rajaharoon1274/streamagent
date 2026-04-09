'use client'
import { useState } from 'react'

const PLATFORMS = [
    { key: 'twitter', label: 'Twitter/X', icon: '𝕏', color: '#000' },
    { key: 'facebook', label: 'Facebook', icon: 'f', color: '#1877F2' },
    { key: 'linkedin', label: 'LinkedIn', icon: 'in', color: '#0A66C2' },
    { key: 'copy', label: 'Copy Link', icon: '🔗', color: '#4F6EF7' },
]

function buildShareUrl(platform, shareUrl, shareText) {
    const encoded = encodeURIComponent(shareUrl)
    const text = encodeURIComponent(shareText || '')
    switch (platform) {
        case 'twitter': return `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`
        case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`
        case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`
        default: return null
    }
}

export default function ShareSocial({ el }) {
    const p = el.props || {}
    const color = p.color || '#4F6EF7'
    const shareUrl = p.shareUrl || (typeof window !== 'undefined' ? window.location.href : '')
    const [copied, setCopied] = useState(false)

    const platforms = (p.platforms?.length ? p.platforms : ['twitter', 'facebook', 'linkedin', 'copy'])

    function handleClick(key) {
        if (key === 'copy') {
            navigator.clipboard?.writeText(shareUrl).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            })
            return
        }
        const url = buildShareUrl(key, shareUrl, p.shareText)
        if (url) window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400')
    }

    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'rgba(10,13,24,0.92)',
            border: `1px solid ${color}33`,
            borderRadius: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '10px 14px', gap: 8,
            boxSizing: 'border-box',
            backdropFilter: 'blur(8px)',
        }}>
            {p.label && (
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                    {p.label}
                </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                {platforms.map(key => {
                    const platform = PLATFORMS.find(pl => pl.key === key)
                    if (!platform) return null
                    return (
                        <button
                            key={key}
                            onClick={() => handleClick(key)}
                            style={{
                                background: key === 'copy' && copied ? '#1ED8A0' : platform.color,
                                border: 'none', borderRadius: 7,
                                width: 34, height: 34,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 13, fontWeight: 800,
                                cursor: 'pointer', transition: 'transform 0.15s, opacity 0.15s',
                                flexShrink: 0,
                            }}
                            title={key === 'copy' && copied ? 'Copied!' : platform.label}
                        >
                            {key === 'copy' && copied ? '✓' : platform.icon}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}