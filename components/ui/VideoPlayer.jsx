'use client'

// VideoPlayer — renders a Cloudflare Stream iframe
// Props:
//   streamUid   — the Cloudflare stream UID (stored in videos.stream_uid)
//   aspectRatio — "16:9" | "9:16" | "1:1" | "4:5" (default "16:9")
//   autoplay    — boolean (default false)
export default function VideoPlayer({ streamUid, aspectRatio = '16:9', autoplay = false }) {
  if (!streamUid) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--s2)', borderRadius: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--t3)' }}>Video not available</div>
      </div>
    )
  }

  // Calculate aspect ratio padding for responsive container
  const AR_MAP = { '16:9': '56.25%', '9:16': '177.78%', '1:1': '100%', '4:5': '125%' }
  const paddingTop = AR_MAP[aspectRatio] || '56.25%'

  // Constrain the player width based on aspect ratio
  const MAX_W_MAP = { '9:16': '300px', '1:1': '480px' }
  const maxWidth = MAX_W_MAP[aspectRatio] || '640px'

  return (
    <div style={{ maxWidth, margin: '0 auto', padding: '0 16px 16px' }}>
      <div style={{ position: 'relative', paddingTop, borderRadius: 8, overflow: 'hidden' }}>
        <iframe
          src={`https://iframe.videodelivery.net/${streamUid}${autoplay ? '?autoplay=true' : ''}`}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%', border: 'none',
          }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="StreamAgent Video Player"
        />
      </div>
    </div>
  )
}
