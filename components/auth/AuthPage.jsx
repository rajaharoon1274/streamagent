'use client'

import { useState, useId, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import toast from 'react-hot-toast'

function LogoSVG({ size = 36 }) {
  const uid = useId().replace(/:/g, '_')
  const gid = `saLogo_${uid}`
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="75 0 240 260"
      width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F6EF7" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path fill={`url(#${gid})`} d="M88 24C88 13 97 6 108 6L112 6L273 92C295 104 306 116 306 130C306 144 295 156 273 168L112 254L108 254C97 254 88 247 88 236Z"/>
      <path fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
        d="M32 154C72 154 92 142 111 127C128 114 143 107 158 107C177 107 194 116 211 124C227 132 244 140 262 140C280 140 295 132 311 121"/>
      <circle cx="153" cy="108" r="9" fill="#FFFFFF"/>
      <circle cx="206" cy="124" r="9" fill="#FFFFFF"/>
      <circle cx="258" cy="140" r="9" fill="#FFFFFF"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function Field({ id, label, type = 'text', placeholder, value, onChange,
  showForgot, onForgot, error, isPassword }) {
  const [visible, setVisible] = useState(false)
  const hasError  = Boolean(error)
  const inputType = isPassword ? (visible ? 'text' : 'password') : type
  return (
    <div className="auth-field">
      <div className="auth-field-head">
        <label className="auth-label" htmlFor={id}>{label}</label>
        {showForgot && (
          <button type="button" className="auth-forgot" onClick={onForgot}>Forgot?</button>
        )}
      </div>
      <div className="auth-input-wrap">
        <input
          id={id}
          className={`auth-input${hasError ? ' auth-input--error' : ''}`}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-err` : undefined}
          autoComplete={
            isPassword
              ? id.includes('confirm') ? 'off' : 'new-password'
              : type === 'email' ? 'email' : 'off'
          }
        />
        {isPassword && (
          <button type="button" className="auth-eye-btn"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}>
            <EyeIcon open={visible} />
          </button>
        )}
      </div>
      {hasError && (
        <span id={`${id}-err`} className="auth-field-error" role="alert">{error}</span>
      )}
    </div>
  )
}

const STATS = [
  { val: '52K+', lbl: 'Video views' },
  { val: '8.4K', lbl: 'Leads captured' },
  { val: '94%',  lbl: 'Engagement rate' },
]

function validate(form, mode) {
  const e = {}
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim())        e.email = 'Email is required'
  else if (!re.test(form.email)) e.email = 'Enter a valid email address'
  if (mode !== 'forgot') {
    if (!form.password)          e.password = 'Password is required'
    else if (mode === 'signup' && form.password.length < 8)
                                 e.password = 'Password must be at least 8 characters'
  }
  if (mode === 'signup') {
    if (!form.firstName.trim())  e.firstName = 'First name is required'
    if (!form.lastName.trim())   e.lastName  = 'Last name is required'
    if (!form.confirmPassword)   e.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword)
                                 e.confirmPassword = 'Passwords do not match'
  }
  return e
}

export default function AuthPage({ initialMode }) {
  const { login } = useApp()
  const router = useRouter()
  const [form, setForm]       = useState({ email:'', password:'', confirmPassword:'', firstName:'', lastName:'' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading]           = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const searchParams = useSearchParams()

  // Show toast if redirected back from OAuth with an error
  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'google_cancelled')     toast('Google sign-in was cancelled.', { icon: 'ℹ️' })
    else if (err === 'auth_callback_failed') toast.error('Sign-in failed. Please try again.')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleGoogleOAuth() {
    setOauthLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (error) {
        toast.error('Could not connect to Google. Please try again.')
        setOauthLoading(false)
      }
      // On success the browser navigates away — no need to reset loading
    } catch {
      toast.error('Something went wrong. Please try again.')
      setOauthLoading(false)
    }
  }

  const isLogin  = initialMode === 'login'
  const isSignup = initialMode === 'signup'
  const isForgot = initialMode === 'forgot'
  const mode     = isLogin ? 'login' : isSignup ? 'signup' : 'forgot'

  const title    = isLogin ? 'Welcome back' : isSignup ? 'Create your account' : 'Reset password'
  const subtitle = isLogin   ? 'Sign in to your dashboard'
    : isSignup ? 'Start turning videos into leads'
    : 'Enter your email to get a reset link'

  const upd = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }))
  }
  const go = page => {
    setErrors({})
    setForm({ email:'', password:'', confirmPassword:'', firstName:'', lastName:'' })
    const routes = { login: '/login', signup: '/signup', forgot: '/forgot' }
    if (routes[page]) router.push(routes[page])
  }

  async function submit(e) {
    e.preventDefault()
    const errs = validate(form, mode)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)

    try {
      if (isForgot) {
        const res = await fetch('/api/auth/forgot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email.toLowerCase().trim() }),
        })
        const data = await res.json()

        if (!res.ok) {
          toast.error(data.error || 'Something went wrong. Please try again.')
          setLoading(false)
          return
        }

        // Always show the same message — don't reveal if email exists
        toast.success('If that email exists, a reset link has been sent.')
        go('login')
        return
      }

      if (isSignup) {
        // ── SIGNUP: call API, redirect to verify page ──────────
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email.toLowerCase().trim(),
            password: form.password,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
          }),
        })
        const data = await res.json()

        if (!res.ok) {
          toast.error(data.error || 'Something went wrong')
          setLoading(false)
          return
        }

        toast.success('Account created! Check your email for a verification code.')
        router.push(`/verify?email=${encodeURIComponent(form.email)}`)
        return
      }

      if (isLogin) {
        // ── LOGIN: client-side Supabase sign-in ─────────────────
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email.toLowerCase().trim(),
          password: form.password,
        })

        if (signInError) {
          if (signInError.message?.includes('Email not confirmed')) {
            toast.error('Please verify your email first.')
            router.push(`/verify?email=${encodeURIComponent(form.email)}`)
            return
          }
          // Check if this is a Google-only account so we can show a helpful message
          try {
            const provRes = await fetch('/api/auth/check-provider', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: form.email.toLowerCase().trim() }),
            })
            const provData = await provRes.json()
            if (provData.code === 'GOOGLE_ONLY') {
              toast.error('Invalid email or password')
              setLoading(false)
              return
            }
          } catch { /* ignore — fall through to generic error */ }
          toast.error('Invalid email or password')
          setLoading(false)
          return
        }

        // Check if email_verified in profiles (server-side check)
        const checkRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        })
        const checkData = await checkRes.json()

        if (!checkRes.ok) {
          // Sign out since Supabase auth succeeded but our check failed
          await supabase.auth.signOut()
          toast.error(checkData.error || 'Invalid email or password')
          setLoading(false)
          return
        }

        // Success — update AppContext and redirect
        login(checkData.user)
        toast.success('Welcome back!')
        router.push('/dashboard')
        return
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">

        {/* ── LEFT: sticky brand panel (desktop only) ── */}
        <aside className="auth-left" aria-label="StreamAgent highlights">
          <div className="auth-left-glow1" />
          <div className="auth-left-glow2" />
          <div className="auth-left-inner">
            <div className="auth-brand-row">
              <div className="auth-logo-wrap"><LogoSVG size={36} /></div>
              <span className="auth-brand-name">StreamAgent</span>
            </div>
            <h1 className="auth-hero">
              Turn passive video<br />into a 24/7 sales machine
            </h1>
            <p className="auth-copy">
              Interactive video that captures leads, routes viewers through personalized
              paths, and closes deals while you sleep.
            </p>
            <div className="auth-stats">
              {STATS.map(s => (
                <div key={s.lbl}>
                  <div className="auth-stat-val">{s.val}</div>
                  <div className="auth-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── RIGHT: scrollable form panel ── */}
        <div className="auth-right">

          {/* Grows + centers the form */}
          <div className="auth-right-inner">
            <div className="auth-form-wrap">

              {/* Mobile logo */}
              <div className="auth-mobile-logo" aria-hidden="true">
                <div className="auth-mobile-logo-wrap"><LogoSVG size={44} /></div>
                <div className="auth-mobile-brand-name">StreamAgent</div>
              </div>

              <h2 className="auth-title">{title}</h2>
              <p className="auth-subtitle">{subtitle}</p>

              <form onSubmit={submit} noValidate>

                {/* Name row — signup only */}
                {isSignup && (
                  <div className="auth-name-row">
                    <Field id="firstName" label="First Name" placeholder="Justin"
                      value={form.firstName} onChange={e => upd('firstName', e.target.value)}
                      error={errors.firstName} />
                    <Field id="lastName" label="Last Name" placeholder="Smith"
                      value={form.lastName} onChange={e => upd('lastName', e.target.value)}
                      error={errors.lastName} />
                  </div>
                )}

                <Field id="email" label="Email" type="email" placeholder="you@company.com"
                  value={form.email} onChange={e => upd('email', e.target.value)}
                  error={errors.email} />

                {!isForgot && (
                  <Field id="password" label="Password" isPassword
                    placeholder={isSignup ? 'Min 8 characters' : 'Enter your password'}
                    value={form.password} onChange={e => upd('password', e.target.value)}
                    showForgot={isLogin} onForgot={() => go('forgot')}
                    error={errors.password} />
                )}

                {isSignup && (
                  <Field id="confirmPassword" label="Confirm Password" isPassword
                    placeholder="Confirm your password"
                    value={form.confirmPassword} onChange={e => upd('confirmPassword', e.target.value)}
                    error={errors.confirmPassword} />
                )}

                {isForgot && <div className="auth-forgot-gap" />}

                <button type="submit" className="auth-primary"
                  disabled={loading} aria-busy={loading}
                  style={{ marginBottom: isForgot ? 0 : 14 }}>
                  {loading ? (
                    <span className="auth-loading">
                      <svg className="auth-spinner" width="15" height="15" viewBox="0 0 24 24"
                        fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"
                        aria-hidden="true">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                      {isLogin ? 'Signing in…' : isSignup ? 'Creating account…' : 'Sending link…'}
                    </span>
                  ) : isLogin ? 'Sign In' : isSignup ? 'Create Account' : 'Send Reset Link'}
                </button>

                {!isForgot && (
                  <>
                    <div className="auth-divider"><span>or</span></div>
                    <div className="auth-oauth-list" role="group" aria-label="Social sign-in options">
                      <button
                        type="button"
                        className="auth-oauth"
                        aria-label="Continue with Google"
                        onClick={handleGoogleOAuth}
                        disabled={oauthLoading || loading}
                      >
                        {oauthLoading ? (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                              style={{ animation: 'spin 0.9s linear infinite' }} aria-hidden="true">
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                            Connecting…
                          </>
                        ) : (
                          <>
                            <GoogleIcon />
                            Continue with Google
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

              </form>
            </div>
          </div>

          {/* Footer — always at bottom, never clipped */}
          <div className="auth-footer">
            {isLogin ? (
              <>Don&apos;t have an account?{' '}
                <button type="button" className="auth-link" onClick={() => go('signup')}>Sign up free</button>
              </>
            ) : isSignup ? (
              <>Already have an account?{' '}
                <button type="button" className="auth-link" onClick={() => go('login')}>Sign in</button>
              </>
            ) : (
              <button type="button" className="auth-link" onClick={() => go('login')}>← Back to sign in</button>
            )}
          </div>

        </div>
    </div>
  )
}