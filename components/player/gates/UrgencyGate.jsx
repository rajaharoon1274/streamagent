'use client'
import { useState, useEffect, useRef } from 'react'

export default function UrgencyGate({
    el, onSubmit, onSkip, skipAvailable, isSubmitting, submitError,
}) {
    const p = el.props || {}
    const gate = el.gate || {}
    const color = p.color || '#FF6B6B'

    const totalSecs = (p.minutes || 5) * 60 + (p.seconds || 0)
    const [remaining, setRemaining] = useState(totalSecs)
    const [email, setEmail] = useState('')
    const [emailErr, setEmailErr] = useState('')
    const timerRef = useRef(null)

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setRemaining(r => Math.max(0, r - 1))
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [])

    const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
    const ss = String(remaining % 60).padStart(2, '0')
    const pct = totalSecs > 0 ? (remaining / totalSecs) * 100 : 0
    const isExpired = remaining === 0

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
        onSubmit({ email: email.trim() })
    }

    return (
        <div style={{
            background: 'rgba(10,11,20,0.99)',
            border: `1px solid ${color}33`,
            borderRadius: 20,
            padding: '32px 28px',
            width: '100%', maxWidth: 400,
            boxShadow: `0 0 80px ${color}22, 0 24px 64px rgba(0,0,0,0.7)`,
            boxSizing: 'border-box',
            textAlign: 'center',
        }}>
            {/* Urgency badge */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: `${color}18`,
                border: `1px solid ${color}44`,
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 11, fontWeight: 700, color,
                marginBottom: 16,
                textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
                🔥 {p.badgeText || 'Limited Time Offer'}
            </div>

            <h2 style={{
                margin: '0 0 8px', fontSize: 22,
                fontWeight: 900, color: '#EEF2FF', lineHeight: 1.25,
            }}>
                {p.headline || 'This Offer Expires Soon'}
            </h2>
            <p style={{
                margin: '0 0 24px', fontSize: 13,
                color: 'rgba(255,255,255,0.5)', lineHeight: 1.5,
            }}>
                {p.subheadline || 'Enter your email to lock in your spot before time runs out'}
            </p>

            {/* Countdown display */}
            <div style={{ marginBottom: 24 }}>
                <div style={{
                    fontFamily: 'monospace',
                    fontSize: 48, fontWeight: 900,
                    color: isExpired ? '#FF6B6B' : color,
                    letterSpacing: '4px', lineHeight: 1,
                    marginBottom: 8,
                    textShadow: `0 0 30px ${color}66`,
                }}>
                    {mm}:{ss}
                </div>
                {/* Progress bar */}
                <div style={{
                    width: '100%', height: 4,
                    background: `${color}22`,
                    borderRadius: 4, overflow: 'hidden',
                }}>
                    <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                        transition: 'width 1s linear',
                        borderRadius: 4,
                    }} />
                </div>
            </div>

            {isExpired ? (
                <div style={{
                    padding: '16px',
                    background: 'rgba(255,107,107,0.1)',
                    border: '1px solid rgba(255,107,107,0.3)',
                    borderRadius: 10, fontSize: 13,
                    color: '#FF6B6B', fontWeight: 600,
                }}>
                    ⏰ This offer has expired
                </div>
            ) : (
                <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                            required
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: `1px solid ${emailErr ? '#FF6B6B' : `${color}33`}`,
                                borderRadius: 9, padding: '12px 14px',
                                fontSize: 13, color: '#EEF2FF',
                                outline: 'none', width: '100%',
                                boxSizing: 'border-box', fontFamily: 'inherit',
                            }}
                        />
                        {emailErr && (
                            <span style={{ fontSize: 11, color: '#FF6B6B', paddingLeft: 2 }}>
                                {emailErr}
                            </span>
                        )}
                    </div>

                    {submitError && (
                        <div style={{
                            background: 'rgba(255,107,107,0.12)',
                            border: '1px solid rgba(255,107,107,0.3)',
                            borderRadius: 8, padding: '8px 12px',
                            fontSize: 12, color: '#FF6B6B',
                        }}>
                            {submitError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            background: isSubmitting ? 'rgba(255,255,255,0.08)'
                                : `linear-gradient(135deg, ${color}, ${color}cc)`,
                            border: 'none', borderRadius: 10,
                            padding: '14px 20px',
                            fontSize: 15, fontWeight: 900,
                            color: isSubmitting ? 'rgba(255,255,255,0.3)' : '#fff',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            boxShadow: isSubmitting ? 'none' : `0 4px 24px ${color}55`,
                            letterSpacing: '0.2px',
                        }}
                    >
                        {isSubmitting ? '⏳ Saving…' : (p.buttonText || '🔒 Claim My Spot Now →')}
                    </button>
                </form>
            )}

            {skipAvailable && !isExpired && (
                <button onClick={onSkip} style={{
                    display: 'block', width: '100%', marginTop: 14,
                    padding: '8px', background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.25)', fontSize: 11, cursor: 'pointer',
                }}>
                    No thanks, skip →
                </button>
            )}
        </div>
    )
}