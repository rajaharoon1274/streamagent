'use client'

import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #0F172A)',
      gap: 12,
      padding: 24,
      fontFamily: 'var(--fn, sans-serif)',
    }}>
      <div style={{
        fontSize: 80,
        fontWeight: 800,
        lineHeight: 1,
        background: 'linear-gradient(135deg, #4F6EF7, #A855F7)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        404
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1, #F8FAFC)', marginTop: 4 }}>
        Page not found
      </div>

      <div style={{ fontSize: 13, color: 'var(--t2, #94A3B8)', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
        This route doesn&apos;t exist or has been moved.
      </div>

      <button
        onClick={() => router.push('/')}
        style={{
          marginTop: 12,
          padding: '10px 28px',
          borderRadius: 10,
          border: 'none',
          background: 'linear-gradient(135deg, #4F6EF7, #A855F7)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Go back
      </button>
    </div>
  )
}

