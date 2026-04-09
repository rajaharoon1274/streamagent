'use client'
import { useState } from 'react'

export default function DownloadGate({
    el, onSubmit, onSkip, skipAvailable, isSubmitting, submitError,
}) {
    const p = el.props || {}
    const gate = el.gate || {}
    const color = p.buttonColor || '#4F6EF7'

    const [email, setEmail] = useState('')
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
        onSubmit({ email: email.trim() })
    }

    return (
        <div style={{
            background: 'rgba(13,16,28,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '28px 24px',
            width: '100%', maxWidth: 360,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            boxSizing: 'border-box',
            textAlign: 'center',
        }}>
            {/* Icon */}
            <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `${color}18`,
                border: `1px solid ${color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, margin: '0 auto 16px',
            }}>
                {p.fileIcon || '📄'}
            </div>

            <h3 style={{
                margin: '0 0 6px', fontSize: 17,
                fontWeight: 800, color: '#EEF2FF',
            }}>
                {p.headline || 'Get the Free Download'}
            </h3>
            <p style={{
                margin: '0 0 20px', fontSize: 12,
                color: 'rgba(255,255,255,0.45)', lineHeight: 1.5,
            }}>
                {p.subheadline || "Enter your email and we'll send it instantly"}
            </p>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                        required
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: `1px solid ${emailErr ? '#FF6B6B' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 9, padding: '11px 14px',
                            fontSize: 13, color: '#EEF2FF',
                            outline: 'none', width: '100%',
                            boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                    />
                    {emailErr && (
                        <span style={{ fontSize: 11, color: '#FF6B6B', textAlign: 'left', paddingLeft: 2 }}>
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
                        background: isSubmitting ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${color}, ${color}dd)`,
                        border: 'none', borderRadius: 10,
                        padding: '13px 20px',
                        fontSize: 14, fontWeight: 800,
                        color: isSubmitting ? 'rgba(255,255,255,0.3)' : '#fff',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        boxShadow: isSubmitting ? 'none' : `0 4px 20px ${color}44`,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8,
                    }}
                >
                    {isSubmitting ? '⏳ Sending…' : (p.buttonText || '📥 Send Me the File →')}
                </button>
            </form>

            {skipAvailable && (
                <button onClick={onSkip} style={{
                    display: 'block', width: '100%', marginTop: 12,
                    padding: '8px', background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer',
                }}>
                    Skip for now →
                </button>
            )}
        </div>
    )
}