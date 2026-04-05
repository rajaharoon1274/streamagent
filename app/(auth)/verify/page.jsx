'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { LogoSvg } from '@/components/ui/Logo'

function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState(['', '', '', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [ready, setReady] = useState(false)
  const inputs = useRef([])

  // Validate that a real pending verification exists for this email
  useEffect(() => {
    if (!email) {
      router.replace('/signup')
      return
    }
    fetch(`/api/auth/verify?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(({ valid }) => {
        if (!valid) {
          router.replace('/signup')
        } else {
          setReady(true)
          setCooldown(60)
        }
      })
      .catch(() => {
        // On network error, let through — POST will catch bad codes
        setReady(true)
        setCooldown(60)
      })
  }, [email, router])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  function handleChange(index, value) {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[index] = v
    setCode(next)
    if (v && index < 7) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 7) inputs.current[index + 1]?.focus()
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (pasted.length === 8) {
      setCode(pasted.split(''))
      inputs.current[7]?.focus()
    }
  }

  async function handleVerify() {
    const fullCode = code.join('')
    if (fullCode.length !== 8) {
      toast.error('Enter all 8 digits')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Verification failed')
        if (res.status === 410 || res.status === 429) {
          setCode(['', '', '', '', '', '', '', ''])
          inputs.current[0]?.focus()
        }
        setLoading(false)
        return
      }

      // Exchange magic link token for a real session
      if (data.token_hash) {
        const supabase = createClient()
        const { error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: data.type || 'email',
        })

        if (sessionError) {
          toast.success('Email verified! Please log in.')
          router.push('/login')
          return
        }
      }

      toast.success('Email verified! Welcome to StreamAgent')
      router.push('/dashboard')

    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0) return
    setResending(true)

    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to resend')
        setResending(false)
        return
      }

      toast.success('New code sent! Check your email.')
      setCode(['', '', '', '', '', '', '', ''])
      setCooldown(60)
      inputs.current[0]?.focus()
    } catch {
      toast.error('Failed to resend code')
    }
    setResending(false)
  }

  const allFilled = code.every(c => c !== '')

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        gap: 14,
      }}>
        <LogoSvg size={36} />
        <svg
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="#4F6EF7" strokeWidth="2.5" strokeLinecap="round"
          style={{ animation: 'spin 0.8s linear infinite' }}
          aria-label="Loading"
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div className="verify-container">

        {/* Logo */}
        <div className="verify-logo">
          <LogoSvg size={32} />
          <div className="verify-brand">StreamAgent</div>
        </div>

        <div className="verify-card">
          <h2 className="verify-title">Check your email</h2>
          <p className="verify-subtitle">
            We sent an 8-digit verification code to{' '}
            <strong style={{ color: 'var(--t1)', wordBreak: 'break-all' }}>{email}</strong>.
            <br /><br />
            ⏱ Code expires in <strong>15 minutes</strong>.
            <br />
            Can&apos;t find it? Check your <strong>spam or junk folder</strong>.
          </p>

          {/* 8 digit inputs */}
          <div className="verify-code-row" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`verify-digit${digit ? ' filled' : ''}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={loading || !allFilled}
            className="verify-btn"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          {/* Resend */}
          <div className="verify-resend">
            {cooldown > 0 ? (
              <span className="verify-cooldown">
                Try again in {cooldown}s
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="verify-resend-btn"
              >
                {resending ? 'Sending…' : '↺ Resend code'}
              </button>
            )}
          </div>
        </div>

        <div className="verify-back">
          <a href="/signup">Back to sign up</a>
        </div>

      </div>

      <style jsx>{`
        .verify-container {
          width: 100%;
          max-width: 420px;
        }
        .verify-logo {
          text-align: center;
          margin-bottom: 32px;
        }
        .verify-brand {
          font-size: 20px;
          font-weight: 800;
          margin-top: 10px;
          background: linear-gradient(135deg, #4F6EF7, #A855F7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .verify-card {
          background: var(--s2);
          border: 1px solid var(--b2);
          border-radius: 16px;
          padding: 36px;
        }
        .verify-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--t1);
          margin-bottom: 6px;
        }
        .verify-subtitle {
          font-size: 13px;
          color: var(--t2);
          margin-bottom: 28px;
          line-height: 1.6;
        }
        .verify-code-row {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 28px;
        }
        .verify-digit {
          width: 40px;
          height: 48px;
          text-align: center;
          font-size: 22px;
          font-weight: 800;
          color: var(--t1);
          background: var(--s4);
          border: 1px solid var(--b2);
          border-radius: 8px;
          outline: none;
          transition: border-color 0.15s;
          font-family: var(--mono);
        }
        .verify-digit:focus {
          border-color: var(--acc);
        }
        .verify-digit.filled {
          border-color: rgba(79, 110, 247, 0.6);
        }
        .verify-btn {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #4F6EF7, #A855F7);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 16px;
          transition: opacity 0.15s;
        }
        .verify-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: var(--s4);
        }
        .verify-resend {
          text-align: center;
        }
        .verify-cooldown {
          font-size: 12px;
          color: var(--t3);
        }
        .verify-resend-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: var(--acc);
          font-weight: 600;
        }
        .verify-resend-btn:disabled {
          opacity: 0.5;
        }
        .verify-back {
          text-align: center;
          margin-top: 16px;
        }
        .verify-back a {
          font-size: 12px;
          color: var(--t2);
          text-decoration: none;
        }
        .verify-back a:hover {
          color: var(--t1);
        }
      `}</style>
    </div>
  )
}

export default function VerifyPageWrapper() {
  return (
    <Suspense fallback={null}>
      <VerifyPage />
    </Suspense>
  )
}
