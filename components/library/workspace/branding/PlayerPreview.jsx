'use client'

const GLOW_STYLE = `
  @keyframes brandingPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(79,110,247,0); }
    50%      { box-shadow: 0 0 0 12px rgba(79,110,247,0); }
  }
`

const LOGO_POS = {
  'top-left': { top: 10, left: 10 },
  'top-right': { top: 10, right: 10 },
  'bottom-left': { bottom: 44, left: 10 },
  'bottom-right': { bottom: 44, right: 10 },
}
const LOGO_SZ = { small: 20, medium: 28, large: 36 }
const PLAY_SZ = { small: 36, medium: 52, large: 68 }

const MODE_RADIUS = {
  'frosted-pill': 24, 'full-bar': 0, 'minimal': 4,
  'glass-card': 16, 'cinematic': 0, 'neon-edge': 8,
  'soft-float': 20, 'brand-accent': 12,
  'standard': 12, 'borderless': 0,
}

export default function PlayerPreview({ b, aspectRatio = '16:9' }) {
  const isVert = aspectRatio === '9:16'
  const brand = b.color || '#4F6EF7'
  const textCol = b.textColor || '#ffffff'
  const playCol = b.playBtnColor || brand
  const scrubCol = b.scrubberColor || brand
  const iconCol = b.barIconColor || '#ffffff'
  const barBg = b.barBg || 'rgba(0,0,0,0.6)'
  const barOpac = b.barOpacity ?? 0.85
  const ps = PLAY_SZ[b.playBtnSize] || 52
  const scrubH = b.scrubberStyle === 'thick' ? 6 : 3

  const playerMode = b.playerMode || 'frosted-pill'
  const cr = MODE_RADIUS[playerMode] ?? (b.cornerRadius ?? 12)
  const isCinematic = playerMode === 'cinematic'
  const isNeon = playerMode === 'neon-edge'
  const showAccentBar = !['minimal', 'borderless', 'full-bar'].includes(playerMode)

  // Play button shape
  let playShapeStyle = { borderRadius: '50%' }
  if (b.playBtnShape === 'square') playShapeStyle = { borderRadius: 12 }
  if (b.playBtnShape === 'pill') playShapeStyle = { borderRadius: ps, paddingLeft: ps * 0.6, paddingRight: ps * 0.6 }

  // Logo
  const logoPosStyle = LOGO_POS[b.logoPosition || 'top-left'] || LOGO_POS['top-left']
  const logoH = LOGO_SZ[b.logoSize || 'small'] || 20

  // Box shadow
  const boxShadow = isNeon
    ? `0 0 20px ${brand}66, 0 0 60px ${brand}22`
    : b.ambientGlow
      ? `0 0 ${Math.round(80 * (b.ambientIntensity || 0.4))}px ${Math.round(24 * (b.ambientIntensity || 0.4))}px ${brand}55`
      : '0 8px 40px rgba(0,0,0,0.6)'

  // THE FIX: 'none' by default — old code had 'var(--b2)' which is bright green in your theme
  const containerBorder = b.borderEnabled === true
    ? `2px solid ${b.borderColor || 'rgba(255,255,255,0.15)'}`
    : 'none'

  // Control bar per barStyle
  const barStyleMap = {
    pill: { borderRadius: 100, margin: '0 12px 10px', padding: '5px 12px' },
    bar: { padding: '7px 12px' },
    minimal: { padding: '3px 12px', background: 'transparent' },
    glass: { borderRadius: 12, margin: '0 12px 12px', padding: '9px 16px', boxShadow: '0 6px 28px rgba(0,0,0,0.4)' },
    cinema: { padding: '10px 16px', background: 'linear-gradient(to top,rgba(0,0,0,0.9),rgba(0,0,0,0.35),transparent)' },
    neon: { padding: '7px 14px', borderTop: `2px solid ${brand}` },
    soft: { borderRadius: 10, margin: '0 10px 8px', padding: '6px 14px', background: 'rgba(255,255,255,0.08)' },
    accent: { padding: '9px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  }
  const barExtra = b.barStyle !== 'hidden' ? (barStyleMap[b.barStyle] || barStyleMap.pill) : null

  return (
    <>
      <style>{GLOW_STYLE}</style>

      {/* Cinematic top bar */}
      {isCinematic && (
        <div style={{ height: 24, background: '#000', borderRadius: `${cr}px ${cr}px 0 0` }} />
      )}

      {/* Accent top line */}
      {showAccentBar && (
        <div style={{
          height: isNeon ? 2 : 3,
          background: isNeon
            ? `linear-gradient(90deg,transparent,${brand},transparent)`
            : brand,
          borderRadius: isCinematic ? 0 : `${cr}px ${cr}px 0 0`,
        }} />
      )}

      {/* Main container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: isVert ? '9/16' : '16/9',
        maxWidth: isVert ? 220 : '100%',
        margin: '0 auto',
        background: 'linear-gradient(135deg,#1a1040,#0a1628)',
        borderRadius: isCinematic ? 0 : `0 0 ${cr}px ${cr}px`,
        overflow: 'hidden',
        border: containerBorder,
        boxShadow,
      }}>

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg,rgba(79,110,247,0.08) 0%,rgba(168,85,247,0.04) 50%,rgba(0,0,0,0.2) 100%)',
        }} />

        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {/* Logo */}
        {b.logoUrl && (
          <div style={{ position: 'absolute', ...logoPosStyle, opacity: b.logoOpacity ?? 0.8, zIndex: 3 }}>
            <img src={b.logoUrl} style={{ height: logoH, objectFit: 'contain' }} alt="logo" />
          </div>
        )}

        {/* Play button */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            ...(b.playBtnShape !== 'pill' ? { width: ps } : {}),
            height: ps,
            background: playCol,
            ...playShapeStyle,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            border: b.playBtnBorder ? '2px solid rgba(255,255,255,0.3)' : 'none',
            animation: b.playBtnPulse !== false ? 'brandingPulse 2s ease-in-out infinite' : 'none',
          }}>
            <svg
              width={Math.round(ps * 0.35)}
              height={Math.round(ps * 0.35)}
              viewBox="0 0 24 24" fill={textCol}
            >
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </div>
        </div>

        {/* Control bar */}
        {b.barStyle !== 'hidden' && barExtra && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
            display: 'flex', alignItems: 'center', gap: 8,
            background: barBg,
            opacity: barOpac,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '5px 12px',
            ...barExtra,
          }}>
            {/* Play icon */}
            {b.showProgress !== false && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill={iconCol}>
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}

            {/* Scrubber */}
            {b.showProgress !== false && (
              <div style={{ flex: 1, height: scrubH, borderRadius: 3, background: 'rgba(255,255,255,0.15)', position: 'relative' }}>
                <div style={{ width: '33%', height: '100%', borderRadius: 3, background: scrubCol }} />
                {b.scrubberStyle === 'dot' && (
                  <div style={{
                    position: 'absolute', top: '50%', left: '33%',
                    transform: 'translate(-50%,-50%)',
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }} />
                )}
              </div>
            )}

            {/* Time */}
            {b.showTime !== false && (
              <span style={{ fontSize: 9, color: iconCol, fontFamily: 'var(--mono)', opacity: 0.7 }}>
                1:22 / 4:00
              </span>
            )}

            {/* StreamAgent badge */}
            {b.badge !== false && (
              <div style={{
                width: 14, height: 14, borderRadius: 4, background: brand,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="6" height="6" viewBox="0 0 24 24" fill="#fff">
                  <polygon points="7,4 21,12 7,20" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Brand Accent bottom strip */}
        {playerMode === 'brand-accent' && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 3, background: brand, zIndex: 5,
          }} />
        )}

      </div>

      {/* Cinematic bottom bar */}
      {isCinematic && (
        <div style={{ height: 24, background: '#000', borderRadius: `0 0 ${cr}px ${cr}px` }} />
      )}
    </>
  )
}