'use client'
import { useState } from 'react'

export default function NpsOverlay({
    el,
    onSubmit,
    onDismiss,
    isGated = false,
    isSubmitting = false,
    submitError = null,
}) {
    const p = el.props || {}
    const color = p.buttonColor || '#06B6D4'

    const [selected, setSelected] = useState(null)
    const [submitted, setSubmitted] = useState(false)

    async function handleSubmit() {
        if (selected === null || submitted) return
        setSubmitted(true)
        await onSubmit?.(selected)
    }

    function scoreColor(n) {
        if (n <= 6) return '#FF6B6B'
        if (n <= 8) return '#F5A623'
        return '#1ED8A0'
    }

    function scoreLabel(n) {
        if (n === null) return ''
        if (n <= 6) return '😞 Detractor'
        if (n <= 8) return '😐 Passive'
        return '😊 Promoter'
    }

    return (
        <div style={{
            background: 'rgba(13,16,28,0.97)',
            border: `1px solid ${color}33`,
            borderRadius: 16,
            padding: '24px 20px',
            width: '100%',
            maxWidth: 420,
            boxShadow: `0 24px 64px rgba(0,0,0,0.6)`,
            boxSizing: 'border-box',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <span style={{
                    fontSize: 11, fontWeight: 700, color,
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                    background: `${color}18`, padding: '3px 8px',
                    borderRadius: 20, border: `1px solid ${color}33`,
                }}>
                    📈 NPS Survey
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
                {p.question || 'How likely are you to recommend us to a friend?'}
            </p>

            {/* 0-10 Scale */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(11, 1fr)',
                gap: 4,
                marginBottom: 8,
            }}>
                {Array.from({ length: 11 }, (_, i) => i).map(n => {
                    const isSelected = selected === n
                    const sc = scoreColor(n)
                    return (
                        <button
                            key={n}
                            onClick={() => !submitted && setSelected(n)}
                            disabled={submitted}
                            style={{
                                background: isSelected ? sc : 'rgba(255,255,255,0.06)',
                                border: `1px solid ${isSelected ? sc : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: 8,
                                padding: '10px 0',
                                fontSize: 13, fontWeight: 800,
                                color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                                cursor: submitted ? 'default' : 'pointer',
                                transition: 'all 0.15s',
                                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                boxShadow: isSelected ? `0 4px 12px ${sc}55` : 'none',
                            }}
                        >
                            {n}
                        </button>
                    )
                })}
            </div>

            {/* Low / High labels */}
            <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 10, color: 'rgba(255,255,255,0.3)',
                marginBottom: 16,
            }}>
                <span>👎 {p.lowLabel || 'Not likely'}</span>
                <span>{selected !== null && (
                    <span style={{ color: scoreColor(selected), fontWeight: 700 }}>
                        {scoreLabel(selected)}
                    </span>
                )}</span>
                <span>👍 {p.highLabel || 'Very likely'}</span>
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
                    disabled={selected === null || isSubmitting}
                    style={{
                        width: '100%',
                        background: selected === null || isSubmitting
                            ? 'rgba(255,255,255,0.08)'
                            : `linear-gradient(135deg, ${color}, ${color}cc)`,
                        border: 'none', borderRadius: 10,
                        padding: '12px 20px',
                        fontSize: 13, fontWeight: 800,
                        color: selected === null ? 'rgba(255,255,255,0.3)' : '#fff',
                        cursor: selected === null ? 'not-allowed' : 'pointer',
                        boxShadow: selected !== null ? `0 4px 16px ${color}44` : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    {isSubmitting ? '⏳ Submitting…' : (p.buttonText || 'Submit')}
                </button>
            ) : (
                <div style={{
                    textAlign: 'center', fontSize: 13,
                    color: '#1ED8A0', fontWeight: 700,
                }}>
                    ✓ Thank you for your feedback!
                </div>
            )}
        </div>
    )
}