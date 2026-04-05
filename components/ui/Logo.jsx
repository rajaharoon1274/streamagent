export function LogoSvg({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="75 0 240 260" width={size} height={Math.round(size * 0.87)}>
      <defs>
        <linearGradient id="sal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F6EF7"/>
          <stop offset="100%" stopColor="#A855F7"/>
        </linearGradient>
      </defs>
      <path fill="url(#sal)" d="M88 24C88 13 97 6 108 6L112 6L273 92C295 104 306 116 306 130C306 144 295 156 273 168L112 254L108 254C97 254 88 247 88 236Z"/>
      <path fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" d="M32 154C72 154 92 142 111 127C128 114 143 107 158 107C177 107 194 116 211 124C227 132 244 140 262 140C280 140 295 132 311 121"/>
      <circle cx="153" cy="108" r="9" fill="#fff"/>
      <circle cx="206" cy="124" r="9" fill="#fff"/>
      <circle cx="258" cy="140" r="9" fill="#fff"/>
    </svg>
  )
}

export function LogoFull({ size = 16 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <LogoSvg size={size} />
      <span style={{ fontSize: size * 0.9, fontWeight: 800, background: 'linear-gradient(90deg,#4F6EF7,#A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.3px' }}>
        StreamAgent
      </span>
    </div>
  )
}
