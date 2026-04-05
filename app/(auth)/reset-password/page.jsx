'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { LogoSvg } from '@/components/ui/Logo'

function EyeIcon({ open }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function PasswordField({ id, label, value, onChange, error, placeholder }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="rp-field">
      <label className="rp-label" htmlFor={id}>{label}</label>
      <div className="rp-input-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`rp-input${error ? ' rp-input--error' : ''}`}
          autoComplete="new-password"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <button
          type="button"
          className="rp-eye-btn"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error && (
        <span id={`${id}-err`} className="rp-field-error" role="alert">{error}</span>
      )}
    </div>
  )
}

function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  // 'loading' | 'valid' | 'invalid' | 'done'
  const [status, setStatus] = useState('loading')
  const [invalidReason, setInvalidReason] = useState('')
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // ── Validate token on mount ──────────────────────────────────
  useEffect(() => {
    if (!token) {
      setInvalidReason('No reset token found. Please request a new password reset.')
      setStatus('invalid')
      return
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(({ valid, reason }) => {
        if (!valid) {
          setInvalidReason(
            reason === 'expired' ? 'This reset link has expired.' :
            reason === 'used'    ? 'This reset link has already been used.' :
            'This reset link is invalid or does not exist.'
          )
          setStatus('invalid')
        } else {
          setStatus('valid')
        }
      })
      .catch(() => {
        // Network error — show form anyway; POST will catch bad tokens
        setStatus('valid')
      })
  }, [token])

  const upd = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }))
  }

  async function submit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.password) {
      errs.password = 'Password is required'
    } else if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters'
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password'
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password, confirmPassword: form.confirmPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 410) {
          setInvalidReason('This reset link has expired.')
          setStatus('invalid')
          return
        }
        // Field-specific error (e.g. same as old password)
        if (data.field === 'password') {
          setErrors({ password: data.error })
        } else {
          toast.error(data.error || 'Something went wrong.')
        }
        setLoading(false)
        return
      }

      setStatus('done')
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div className="rp-container">

        {/* Logo */}
        <div className="rp-logo">
          <LogoSvg size={32} />
          <div className="rp-brand">StreamAgent</div>
        </div>

        {/* ── Loading ── */}
        {status === 'loading' && (
          <div className="rp-card rp-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="#4F6EF7" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: 'rp-spin 0.8s linear infinite' }} aria-label="Loading">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <p className="rp-loading-text">Verifying reset link…</p>
          </div>
        )}

        {/* ── Invalid / Expired ── */}
        {status === 'invalid' && (
          <div className="rp-card">
            <div className="rp-icon-wrap rp-icon-err">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="rp-title">Link expired</h2>
            <p className="rp-subtitle">{invalidReason}</p>
            <a href="/forgot" className="rp-btn rp-btn-outline">Request a new reset link</a>
            <a href="/login" className="rp-back">← Back to sign in</a>
          </div>
        )}

        {/* ── Form ── */}
        {status === 'valid' && (
          <div className="rp-card">
            <h2 className="rp-title">Choose a new password</h2>
            <p className="rp-subtitle">
              Must be different from your current password.
            </p>
            <form onSubmit={submit} noValidate>
              <PasswordField
                id="password"
                label="New Password"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={e => upd('password', e.target.value)}
                error={errors.password}
              />
              <PasswordField
                id="confirmPassword"
                label="Confirm New Password"
                placeholder="Repeat new password"
                value={form.confirmPassword}
                onChange={e => upd('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
              />
              <button type="submit" className="rp-btn" disabled={loading} aria-busy={loading}>
                {loading ? (
                  <span className="rp-btn-loading">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="#fff" strokeWidth="2.5" strokeLinecap="round"
                      style={{ animation: 'rp-spin 0.8s linear infinite' }} aria-hidden="true">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Updating…
                  </span>
                ) : 'Update Password'}
              </button>
            </form>
            <a href="/login" className="rp-back">← Back to sign in</a>
          </div>
        )}

        {/* ── Done ── */}
        {status === 'done' && (
          <div className="rp-card">
            <div className="rp-icon-wrap rp-icon-ok">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="rp-title">Password updated!</h2>
            <p className="rp-subtitle">
              Your password has been changed. You can now sign in with your new password.
            </p>
            <button className="rp-btn" onClick={() => router.push('/login')}>
              Go to Sign In
            </button>
          </div>
        )}

      </div>

      <style>{`

        .rp-container {
          width: 100%;
          max-width: 420px;
        }
        .rp-logo {
          text-align: center;
          margin-bottom: 32px;
        }
        .rp-brand {
          font-size: 20px;
          font-weight: 800;
          margin-top: 10px;
          background: linear-gradient(135deg, #4F6EF7, #A855F7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .rp-card {
          background: var(--s2);
          border: 1px solid var(--b2);
          border-radius: 16px;
          padding: 48px 40px;
        }
        .rp-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 48px 36px;
        }
        .rp-loading-text {
          font-size: 13px;
          color: var(--t2);
          margin: 0;
        }
        .rp-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .rp-icon-err {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }
        .rp-icon-ok {
          background: rgba(30, 216, 160, 0.12);
          color: #1ed8a0;
        }
        .rp-title {
          font-size: 26px;
          font-weight: 800;
          color: var(--t1);
          margin: 0 0 8px;
          text-align: center;
          letter-spacing: '-0.5px';
        }
        .rp-subtitle {
          font-size: 14px;
          color: var(--t2);
          margin: 0 0 32px;
          line-height: 1.6;
          text-align: center;
        }
        .rp-field {
          margin-bottom: 22px;
        }
        .rp-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--t1);
          margin-bottom: 8px;
        }
        .rp-input-wrap {
          position: relative;
        }
        .rp-input {
          width: 100%;
          padding: 14px 44px 14px 14px;
          border-radius: 10px;
          background: var(--s3);
          border: 1px solid var(--b2);
          color: var(--t1);
          font-size: 14px;
          line-height: 1.5;
          transition: all 0.15s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .rp-input::placeholder {
          color: var(--t2);
          font-size: 13px;
        }
        .rp-input:hover {
          border-color: var(--b3);
        }
        .rp-input:focus {
          outline: none;
          border-color: var(--acc);
          background: var(--s2);
          box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.08);
        }
        .rp-input--error {
          border-color: #ef4444;
        }
        .rp-input--error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
        }
        .rp-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--t3);
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
          border-radius: 6px;
        }
        .rp-eye-btn:hover {
          color: var(--t2);
          background: rgba(79, 110, 247, 0.06);
        }
        .rp-field-error {
          display: block;
          font-size: 11px;
          color: #ef4444;
          margin-top: 5px;
        }
        .rp-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #4F6EF7, #A855F7);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 6px;
          transition: all 0.15s;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(79, 110, 247, 0.3);
        }
        .rp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 110, 247, 0.4);
        }
        .rp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .rp-btn-outline {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: 1.5px solid var(--b2);
          background: transparent;
          color: var(--t1);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 6px;
          text-decoration: none;
          box-sizing: border-box;
          transition: all 0.15s;
        }
        .rp-btn-outline:hover {
          border-color: var(--acc);
          background: rgba(79, 110, 247, 0.04);
          color: var(--acc);
        }
        .rp-btn-loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rp-back {
          display: block;
          text-align: center;
          font-size: 12px;
          color: var(--t2);
          margin-top: 16px;
          text-decoration: none;
        }
        .rp-back:hover {
          color: var(--t1);
        }
        @keyframes rp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPage />
    </Suspense>
  )
}
