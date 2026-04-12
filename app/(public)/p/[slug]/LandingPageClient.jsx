'use client'

import VideoPlayer from '@/components/player/VideoPlayer'

function isDark(hex) {
    if (!hex || !hex.startsWith('#')) return true
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128
}

function getBackgroundStyle(lp) {
    const type = lp.bgType || 'solid'
    if (type === 'gradient' && lp.bgGradient)
        return { background: lp.bgGradient }
    if (type === 'image' && lp.bgImageUrl)
        return {
            backgroundImage: `url(${lp.bgImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }
    return { background: lp.bgColor || lp.bg || '#0F172A' }
}

// Safe non-empty string — treats '' same as null
function ne(val) { return val && val.trim() !== '' ? val : null }

export default function LandingPageClient({ video, workspace }) {
    const lp = video.landing_page || {}
    const branding = video.branding || {}

    // ── Resolve colors — ne() prevents empty string fallthrough ──────────────
    const brand = ne(lp.brand) || ne(branding.color) || ne(video.color) || '#4F6EF7'
    const textColor = ne(lp.textColor) || ne(lp.tc) || '#EEF2FF'
    const ctaColor = ne(lp.ctaColor) || brand
    const bgStyle = getBackgroundStyle(lp)
    const bgBase = lp.bgColor || lp.bg || '#0F172A'
    const dark = isDark(bgBase)
    const muted_txt = dark ? 'rgba(238,242,255,0.62)' : '#475569'
    const divider = dark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'

    const logoText = ne(lp.logoText) || video.title || 'StreamAgent'
    const subtext = ne(lp.subtext) || ne(lp.subheadline) || ''
    const bodyHtml = lp.bodyHtml || ''
    const bodyPlain = !bodyHtml ? (lp.body || '') : ''

    // ── Player branding — ne() prevents empty string overriding defaults ──────
    const playerBranding = {
        color: ne(branding.color) || brand,
        textColor: ne(branding.textColor) || '#ffffff',
        logoUrl: ne(branding.logoUrl) || '',
        logoPosition: branding.logoPosition || 'top-left',
        logoSize: branding.logoSize || 'small',
        logoOpacity: branding.logoOpacity ?? 0.8,
        logoClickUrl: ne(branding.logoClickUrl) || '',
        playerMode: branding.playerMode || 'frosted-pill',
        badge: branding.badge !== false,
        autoplay: branding.autoplay === true,
        muted: branding.muted === true || branding.autoplay === true,
        showProgress: branding.showProgress !== false,
        showTime: branding.showTime !== false,
        cornerRadius: branding.cornerRadius ?? 12,
        borderEnabled: branding.borderEnabled === true,
        borderColor: ne(branding.borderColor) || 'rgba(255,255,255,0.1)',
        ambientGlow: branding.ambientGlow === true,
        ambientIntensity: branding.ambientIntensity ?? 0.4,
        barStyle: branding.barStyle || 'pill',
        barOpacity: branding.barOpacity ?? 0.85,
        barIconColor: ne(branding.barIconColor) || '#ffffff',
        scrubberColor: ne(branding.scrubberColor) || ne(branding.color) || brand,
        scrubberStyle: branding.scrubberStyle || 'thin',
    }

    return (
        <div style={{
            ...bgStyle,
            minHeight: '100vh',
            fontFamily: lp.font ? `'${lp.font}', sans-serif` : "'Outfit', system-ui, sans-serif",
        }}>

            {/* ── Nav / Logo ──────────────────────────────────────────────────── */}
            {lp.showLogo !== false && (
                <nav style={{
                    padding: '16px 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: `1px solid ${divider}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {lp.logoUrl ? (
                            <img src={lp.logoUrl} style={{ height: 36, objectFit: 'contain', borderRadius: 6 }} alt="logo" />
                        ) : (
                            <div style={{
                                width: 34, height: 34, borderRadius: 9, background: brand,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, flexShrink: 0,
                            }}>⚡</div>
                        )}
                        <span style={{ fontSize: 19, fontWeight: 800, color: textColor, letterSpacing: '-0.3px' }}>
                            {logoText}
                        </span>
                    </div>
                </nav>
            )}

            <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px 64px' }}>

                {/* Hero */}
                {lp.showHero !== false && lp.heroUrl && (
                    <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <img src={lp.heroUrl} style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }} alt="hero" />
                    </div>
                )}

                {/* Headline */}
                {lp.showHeadline !== false && (lp.headline || video.title) && (
                    <h1 style={{
                        fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 800, color: textColor,
                        lineHeight: 1.18, textAlign: 'center', marginBottom: 14, marginTop: 0,
                    }}>
                        {lp.headline || video.title}
                    </h1>
                )}

                {/* Subtext */}
                {subtext && (
                    <p style={{ fontSize: 17, color: muted_txt, textAlign: 'center', marginBottom: 28, lineHeight: 1.75, marginTop: 0 }}>
                        {subtext}
                    </p>
                )}

                {/* ── Video player ─────────────────────────────────────────────── */}
                {lp.showVideo !== false && video.stream_uid && (
                    <div style={{ marginBottom: 28 }}>
                        <VideoPlayer
                            streamUid={video.stream_uid}
                            aspectRatio={video.aspect_ratio || '16:9'}
                            autoplay={playerBranding.autoplay}
                            muted={playerBranding.muted}
                            branding={playerBranding}
                        />
                    </div>
                )}

                {/* Rich body HTML */}
                {lp.showBody !== false && bodyHtml && (
                    <div
                        style={{ color: muted_txt, lineHeight: 1.85, maxWidth: 580, margin: '0 auto 28px', fontSize: 15, textAlign: 'center' }}
                        dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                )}

                {/* Plain body */}
                {lp.showBody !== false && bodyPlain && !bodyHtml && (
                    <p style={{ fontSize: 15, color: muted_txt, lineHeight: 1.85, maxWidth: 580, margin: '0 auto 28px', textAlign: 'center' }}>
                        {bodyPlain}
                    </p>
                )}

                {/* ── CTA Button — uses ctaColor ────────────────────────────────── */}
                {lp.showCTA !== false && lp.ctaText && (
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <a
                            href={lp.ctaUrl || '#'}
                            target={lp.ctaUrl ? '_blank' : undefined}
                            rel="noreferrer"
                            style={{
                                display: 'inline-block', padding: '15px 44px', borderRadius: 50,
                                background: ctaColor, color: '#fff', fontSize: 16, fontWeight: 700,
                                textDecoration: 'none', boxShadow: `0 8px 28px ${ctaColor}66`, letterSpacing: '-0.2px',
                            }}
                        >
                            {lp.ctaText} →
                        </a>
                    </div>
                )}

                {/* Powered by */}
                {lp.showPowered !== false && (
                    <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 18, borderTop: `1px solid ${divider}` }}>
                        <span style={{ fontSize: 11, color: muted_txt }}>Powered by </span>
                        <a href="https://streamagent.io" target="_blank" rel="noreferrer"
                            style={{ fontSize: 11, fontWeight: 700, color: brand, textDecoration: 'none' }}>
                            StreamAgent
                        </a>
                    </div>
                )}

            </div>
        </div>
    )
}