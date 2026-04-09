'use client'
import { useState, useEffect } from 'react'

export default function BookingGate({ el, onSkip, skipAvailable }) {
    const p = el.props || {}
    const gate = el.gate || {}
    const color = p.buttonColor || '#4F6EF7'
    const calUrl = p.calUrl || ''

    // Detect if it's an embeddable URL (Calendly / Cal.com)
    const isEmbeddable = /calendly\.com|cal\.com/.test(calUrl)
    const [loaded, setLoaded] = useState(false)

    // For redirect-style booking — just open in new tab
    function handleRedirect() {
        if (calUrl) window.open(calUrl, '_blank', 'noopener,noreferrer')
    }

    return (
        <div style={{
            background: 'rgba(13,16,28,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: isEmbeddable ? '0' : '28px 24px',
            width: '100%',
            maxWidth: isEmbeddable ? 480 : 360,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            boxSizing: 'border-box',
        }}>
            {isEmbeddable ? (
                // ── Calendly / Cal.com embed ──────────────────────────────────
                <div style={{ position: 'relative' }}>
                    {!loaded && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(13,16,28,0.97)',
                            zIndex: 2,
                        }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                border: `2px solid ${color}33`,
                                borderTop: `2px solid ${color}`,
                                animation: 'gate-spin 0.8s linear infinite',
                            }} />
                        </div>
                    )}
                    <iframe
                        src={calUrl}
                        onLoad={() => setLoaded(true)}
                        style={{
                            width: '100%', height: 500,
                            border: 'none', display: 'block',
                            borderRadius: 16,
                        }}
                        title="Book a call"
                    />
                </div>
            ) : (
                // ── Redirect style ────────────────────────────────────────────
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                    <h3 style={{
                        margin: '0 0 8px', fontSize: 18,
                        fontWeight: 800, color: '#EEF2FF',
                    }}>
                        {p.headline || 'Book Your Free Call'}
                    </h3>
                    <p style={{
                        margin: '0 0 22px', fontSize: 13,
                        color: 'rgba(255,255,255,0.5)', lineHeight: 1.5,
                    }}>
                        {p.subheadline || 'Choose a time that works for you'}
                    </p>
                    <button
                        onClick={handleRedirect}
                        style={{
                            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                            border: 'none', borderRadius: 10,
                            padding: '13px 28px',
                            fontSize: 14, fontWeight: 800,
                            color: '#fff', cursor: 'pointer',
                            boxShadow: `0 4px 20px ${color}44`,
                        }}
                    >
                        {p.buttonText || 'Schedule Now →'}
                    </button>
                </div>
            )}

            {/* Skip */}
            {skipAvailable && (
                <button
                    onClick={onSkip}
                    style={{
                        display: 'block', width: '100%',
                        margin: '12px 0 8px', padding: '8px',
                        background: 'transparent', border: 'none',
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: 11, cursor: 'pointer',
                    }}
                >
                    Skip for now →
                </button>
            )}
            <style>{`@keyframes gate-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}