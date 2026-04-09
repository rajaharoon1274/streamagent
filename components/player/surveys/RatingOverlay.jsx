'use client'
import { useState } from 'react'

export default function RatingOverlay({
    el,
    onSubmit,
    onDismiss,
    isGated = false,
    isSubmitting = false,
    submitError = null,
}) {
    const p = el.props || {}
    const color = p.buttonColor || '#F5A623'
    const stars = Math.min(10, Math.max(3, p.stars || 5))

    const [hovered, setHovered] = useState(0)
    const [selected, setSelected] = useState(0)
    const [submitted, setSubmitted] = useState(false)

    async function handleSubmit() {
        if (!selected || submitted) return
        setSubmitted(true)
        await onSubmit?.(selected)
    }

    const active = hovered || selected

    return (
        <div style={{
            background: 'rgba(13,16,28,0.97)',
            border: `1px solid ${color}33`,
            borderRadius: 16,
            padding: '24px 20px',
            width: '100%',
            maxWidth: 360,
            boxShadow: `0 24px 64px rgba(0,0,0,0.6)`,
            boxSizing: 'border-box',
            textAlign: 'center',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <span style={{
                    fontSize: 11, fontWeight: 700, color,
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                    background: `${color}18`, padding: '3px 8px',
                    borderRadius: 20, border: `1px solid ${color}33`,
                }}>
                    ⭐ Rating
                </span>
                {!isGated && (
                    <button
                        onClick={onDismiss}
                        style={{
                            marginLeft: 'auto', background: 'none', border: 'none',
                            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                            fontSize: 16, padding: 4,
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            <p style={{
                fontSize: 14, fontWeight: 700, color: '#EEF2FF',
                lineHeight: 1.4, margin: '0 0 20px',
            }}>
                {p.question || 'How valuable was this information?'}
            </p>

            {/* Stars */}
            <div
                style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}
                onMouseLeave={() => !submitted && setHovered(0)}
            >
                {Array.from({ length: stars }, (_, i) => i + 1).map(star => (
                    <button
                        key={star}
                        onClick={() => !submitted && setSelected(star)}
                        onMouseEnter={() => !submitted && setHovered(star)}
                        disabled={submitted}
                        style={{
                            background: 'none', border: 'none',
                            fontSize: stars <= 5 ? 36 : 26,
                            cursor: submitted ? 'default' : 'pointer',
                            color: star <= active ? color : 'rgba(255,255,255,0.15)',
                            transition: 'color 0.15s, transform 0.15s',
                            transform: star <= active && !submitted ? 'scale(1.15)' : 'scale(1)',
                            lineHeight: 1, padding: '2px 1px',
                        }}
                    >
                        ★
                    </button>
                ))}
            </div>

            {/* Label */}
            <div style={{
                fontSize: 12, color: 'rgba(255,255,255,0.4)',
                marginBottom: 16, minHeight: 18,
            }}>
                {submitted
                    ? `You rated ${selected} / ${stars} stars`
                    : active > 0
                        ? ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][Math.ceil(active / stars * 5)] || `${active} / ${stars}`
                        : 'Select a rating'
                }
            </div>

            {submitError && (
                <div style={{
                    marginBottom: 10, padding: '8px 12px',
                    background: 'rgba(255,107,107,0.12)',
                    border: '1px solid rgba(255,107,107,0.3)',
                    borderRadius: 8, fontSize: 12, color: '#FF6B6B',
                }}>
                    {submitError}
                </div>
            )}

            {!submitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={!selected || isSubmitting}
                    style={{
                        width: '100%',
                        background: !selected || isSubmitting
                            ? 'rgba(255,255,255,0.08)'
                            : `linear-gradient(135deg, ${color}, ${color}cc)`,
                        border: 'none', borderRadius: 10,
                        padding: '11px 20px',
                        fontSize: 13, fontWeight: 800,
                        color: !selected ? 'rgba(255,255,255,0.3)' : '#fff',
                        cursor: !selected ? 'not-allowed' : 'pointer',
                        boxShadow: selected ? `0 4px 16px ${color}44` : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    {isSubmitting ? '⏳ Submitting…' : (p.buttonText || 'Submit Rating')}
                </button>
            ) : (
                <div style={{
                    fontSize: 13, color: '#1ED8A0', fontWeight: 700,
                }}>
                    ✓ Thanks for your feedback!
                    {!isGated && (
                        <button
                            onClick={onDismiss}
                            style={{
                                marginLeft: 8, background: 'none', border: 'none',
                                color, fontSize: 12, cursor: 'pointer', fontWeight: 700,
                            }}
                        >
                            Close
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}