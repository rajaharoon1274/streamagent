'use client'
import { useState } from 'react'

export default function LeadCaptureForm({
    el, onSubmit, onSkip, skipAvailable, isSubmitting, submitError,
}) {
    const p = el.props || {}
    const gate = el.gate || {}
    const color = p.buttonColor || '#4F6EF7'

    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [emailErr, setEmailErr] = useState('')

    function validate() {
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setEmailErr('Please enter a valid email address')
            return false
        }
        setEmailErr('')
        return true
    }

    function handleSubmit(e) {
        e.preventDefault()
        if (!validate()) return
        onSubmit({ email: email.trim(), name: name.trim(), phone: phone.trim() })
    }

    return (
        <div style={{
            background: 'rgba(13,16,28,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '28px 24px',
            width: '100%',
            maxWidth: 380,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            boxSizing: 'border-box',
        }}>
            {/* Header */}
            {p.headline && (
                <h3 style={{
                    margin: '0 0 6px',
                    fontSize: 18, fontWeight: 800,
                    color: '#EEF2FF', textAlign: 'center', lineHeight: 1.3,
                }}>
                    {p.headline}
                </h3>
            )}
            {p.subheadline && (
                <p style={{
                    margin: '0 0 20px',
                    fontSize: 13, color: 'rgba(255,255,255,0.5)',
                    textAlign: 'center', lineHeight: 1.5,
                }}>
                    {p.subheadline}
                </p>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Name field */}
                {gate.collectName && (
                    <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={inputStyle}
                    />
                )}

                {/* Email field — always shown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                        required
                        style={{
                            ...inputStyle,
                            borderColor: emailErr ? '#FF6B6B' : 'rgba(255,255,255,0.1)',
                        }}
                    />
                    {emailErr && (
                        <span style={{ fontSize: 11, color: '#FF6B6B', paddingLeft: 2 }}>
                            {emailErr}
                        </span>
                    )}
                </div>

                {/* Phone field */}
                {gate.collectPhone && (
                    <input
                        type="tel"
                        placeholder="Phone (optional)"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        style={inputStyle}
                    />
                )}

                {/* API error */}
                {submitError && (
                    <div style={{
                        background: 'rgba(255,107,107,0.12)',
                        border: '1px solid rgba(255,107,107,0.3)',
                        borderRadius: 8, padding: '8px 12px',
                        fontSize: 12, color: '#FF6B6B', textAlign: 'center',
                    }}>
                        {submitError}
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        background: isSubmitting
                            ? 'rgba(255,255,255,0.1)'
                            : `linear-gradient(135deg, ${color}, ${color}dd)`,
                        border: 'none',
                        borderRadius: 10,
                        padding: '13px 20px',
                        fontSize: 14, fontWeight: 800,
                        color: isSubmitting ? 'rgba(255,255,255,0.4)' : '#fff',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8,
                        boxShadow: isSubmitting ? 'none' : `0 4px 20px ${color}44`,
                        marginTop: 2,
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <Spinner />
                            Saving…
                        </>
                    ) : (p.buttonText || 'Get Instant Access →')}
                </button>
            </form>

            {/* Skip button */}
            {skipAvailable && (
                <button
                    onClick={onSkip}
                    style={{
                        display: 'block', width: '100%',
                        marginTop: 12, padding: '8px',
                        background: 'transparent', border: 'none',
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: 11, cursor: 'pointer',
                        transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
                >
                    Skip for now →
                </button>
            )}
        </div>
    )
}

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 9,
    padding: '11px 14px',
    fontSize: 13,
    color: '#EEF2FF',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
}

function Spinner() {
    return (
        <div style={{
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            borderTop: '2px solid #fff',
            animation: 'gate-spin 0.7s linear infinite',
            flexShrink: 0,
        }}>
            <style>{`@keyframes gate-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}