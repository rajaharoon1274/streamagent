'use client'

function isDark(hex) {
  if (!hex || !hex.startsWith('#')) return true
  const h = hex.slice(1).padEnd(6, '0')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128
}

// Resolves background style — supports solid / gradient / image
// Reads ALL key variants so nothing gets lost between saves
function resolveBg(lp) {
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
  // solid — read new key (bgColor) first, fall back to old key (bg)
  const solidColor = lp.bgColor || lp.bg || '#0F172A'
  return { background: solidColor }
}

// Mock video player — correct aspect ratio + brand color
function VideoMock({ video, brand }) {
  // DB column is aspect_ratio; local state sometimes uses aspectRatio
  const ar = video?.aspect_ratio || video?.aspectRatio || '16:9'
  const arStyle =
    ar === '9:16' ? { aspectRatio: '9/16', maxWidth: 240, margin: '0 auto' } :
      ar === '1:1' ? { aspectRatio: '1/1', maxWidth: 380, margin: '0 auto' } :
        ar === '4:5' ? { aspectRatio: '4/5', maxWidth: 340, margin: '0 auto' } :
          { aspectRatio: '16/9' }

  return (
    <div style={{
      ...arStyle,
      background: brand || '#4F6EF7',
      borderRadius: 13,
      overflow: 'hidden',
      boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
      marginBottom: 16,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.22)' }} />
      {/* Play button */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" fill={brand || '#4F6EF7'} />
          </svg>
        </div>
      </div>
      {/* Progress bar mock */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.3)', padding: '7px 13px',
      }}>
        <div style={{
          height: 3, borderRadius: 2,
          background: `linear-gradient(90deg, ${brand || '#4F6EF7'} 35%, rgba(255,255,255,0.15) 35%)`,
          marginBottom: 5,
        }} />
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
          0:00 / {video?.dur || video?.duration || '4:00'}
        </span>
      </div>
    </div>
  )
}

const SAMPLE_COMMENTS = [
  { initials: 'SM', color: '#FF6B6B', name: 'Sarah M.', text: 'Incredible breakdown. The interactive part was a game changer.', time: '2h ago' },
  { initials: 'JR', color: '#4F6EF7', name: 'James R.', text: 'Booked my call after watching. Highly recommend.', time: '5h ago' },
]

export default function LandingPagePreview({ lp, video }) {
  const bgStyle = resolveBg(lp)

  // ── Resolve colors — read ALL key variants ────────────────────────────────
  // textColor: new key || old key || fallback
  const tc = lp.textColor || lp.tc || '#EEF2FF'
  // brand/accent: lp.brand || branding color saved on video || fallback
  const brand = (lp.brand && lp.brand !== '')
    ? lp.brand
    : (video?.branding?.color || video?.color || '#4F6EF7')
  // CTA button color: ctaColor || brand
  const ctaColor = (lp.ctaColor && lp.ctaColor !== '') ? lp.ctaColor : brand
  // subtext: read BOTH keys
  const subtext = lp.subtext || lp.subheadline || ''
  // body: read both HTML and plain
  const bodyHtml = lp.bodyHtml || ''
  const bodyPlain = !bodyHtml ? (lp.body || '') : ''

  // Derive bg base color for dark detection
  const bgBase = lp.bgColor || lp.bg || '#0F172A'
  const dark = isDark(bgBase)
  const muted = dark ? 'rgba(238,242,255,0.55)' : '#475569'
  const divider = dark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'

  return (
    <div style={{ ...bgStyle, minHeight: '100%', fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Logo / Nav ───────────────────────────────────────────────── */}
      {lp.showLogo !== false && (
        <nav style={{
          padding: '16px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: `1px solid ${divider}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {lp.logoUrl ? (
              <img
                src={lp.logoUrl}
                style={{ height: 34, objectFit: 'contain', borderRadius: 6 }}
                alt="logo"
              />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: 9, background: brand,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              }}>⚡</div>
            )}
            <span style={{ fontSize: 18, fontWeight: 800, color: tc, letterSpacing: '-0.3px' }}>
              {/* Always show text — use logoText or video title as fallback */}
              {lp.logoText || video?.title || 'StreamAgent'}
            </span>
          </div>
        </nav>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 48px' }}>

        {/* ── Hero Image ──────────────────────────────────────────────── */}
        {lp.showHero !== false && (
          lp.heroUrl ? (
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <img src={lp.heroUrl} style={{ width: '100%', display: 'block', maxHeight: 300, objectFit: 'cover' }} alt="hero" />
            </div>
          ) : null
        )}

        {/* ── Headline ────────────────────────────────────────────────── */}
        {lp.showHeadline !== false && (lp.headline || video?.title) && (
          <h1 style={{
            fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800,
            color: tc, lineHeight: 1.2, textAlign: 'center',
            marginBottom: 12, marginTop: 0,
          }}>
            {lp.headline || video?.title}
          </h1>
        )}

        {/* ── Subtext ─────────────────────────────────────────────────── */}
        {subtext && (
          <p style={{
            fontSize: 15, color: muted, textAlign: 'center',
            marginBottom: 22, lineHeight: 1.7, marginTop: 0,
          }}>
            {subtext}
          </p>
        )}

        {/* ── Video mock ──────────────────────────────────────────────── */}
        {lp.showVideo !== false && (
          <VideoMock video={video} brand={brand} />
        )}

        {/* ── Body HTML ───────────────────────────────────────────────── */}
        {lp.showBody !== false && bodyHtml && (
          <div
            style={{ fontSize: 14, color: muted, lineHeight: 1.85, maxWidth: 560, margin: '0 auto 22px', textAlign: 'center' }}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        )}

        {/* ── Body plain fallback ─────────────────────────────────────── */}
        {lp.showBody !== false && bodyPlain && !bodyHtml && (
          <p style={{ fontSize: 14, color: muted, lineHeight: 1.85, maxWidth: 560, margin: '0 auto 22px', textAlign: 'center' }}>
            {bodyPlain}
          </p>
        )}

        {/* ── CTA Button — uses ctaColor ───────────────────────────────── */}
        {lp.showCTA !== false && lp.ctaText && (
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <a
              href={lp.ctaUrl || '#'}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                padding: '14px 36px',
                borderRadius: 50,
                background: ctaColor,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: `0 6px 24px ${ctaColor}55`,
                letterSpacing: '-0.2px',
              }}
            >
              {lp.ctaText} →
            </a>
          </div>
        )}

        {/* ── Comments ────────────────────────────────────────────────── */}
        {lp.showComments && (
          <div style={{ marginTop: 28, borderTop: `1px solid ${divider}`, paddingTop: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: tc, marginBottom: 14 }}>💬 Comments</div>
            {SAMPLE_COMMENTS.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: c.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {c.initials}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: tc }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: muted }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>{c.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Powered By ──────────────────────────────────────────────── */}
        {lp.showPowered !== false && (
          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: `1px solid ${divider}` }}>
            <span style={{ fontSize: 10, color: muted }}>Powered by </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: brand }}>StreamAgent</span>
          </div>
        )}

      </div>
    </div>
  )
}