'use client'
import { useState } from 'react'

/**
 * survey-poll — multiple choice poll
 * Props from el.props: question, options[], buttonColor, showResults
 * Can be gated (gate.enabled=true) or non-gated
 */
export default function PollOverlay({
    el,
    onSubmit,      // async (value) => void
    onDismiss,     // () => void — for non-gated dismiss
    isGated = false,
    isSubmitting = false,
    submitError = null,
}) {
    const p = el.props || {}
    const color = p.buttonColor || '#A855F7'
    const options = Array.isArray(p.options) ? p.options : [
        'More leads', 'Better conversions', 'Build my brand', 'Save time',
    ]

    const [selected, setSelected] = useState(null)
    const [submitted, setSubmitted] = useState(false)
    const [voteCounts, setVoteCounts] = useState(() =>
        Object.fromEntries(options.map(o => [o, Math.floor(Math.random() * 40) + 5]))
    )

    function handleVote(opt) {
        if (submitted) return
        setSelected(opt)
    }

    async function handleSubmit() {
        if (!selected || submitted) return
        setSubmitted(true)

        // Update local vote count for results display
        setVoteCounts(prev => ({ ...prev, [selected]: (prev[selected] || 0) + 1 }))

        await onSubmit?.(selected)
    }

    const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0)
    const showResults = submitted && (p.showResults !== false)

    return (
        <div style={{
            background: 'rgba(13,16,28,0.97)',
            border: `1px solid ${color}33`,
            borderRadius: 16,
            padding: '24px 20px',
            width: '100%',
            maxWidth: 380,
            boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${color}22`,
            boxSizing: 'border-box',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center',
                gap: 8, marginBottom: 16,
            }}>
                <span style={{
                    fontSize: 11, fontWeight: 700,
                    color, textTransform: 'uppercase', letterSpacing: '0.8px',
                    background: `${color}18`,
                    padding: '3px 8px', borderRadius: 20,
                    border: `1px solid ${color}33`,
                }}>
                    📊 Quick Poll
                </span>
                {!isGated && (
                    <button
                        onClick={onDismiss}
                        style={{
                            marginLeft: 'auto', background: 'none', border: 'none',
                            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                            fontSize: 16, lineHeight: 1, padding: 4,
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            <p style={{
                fontSize: 14, fontWeight: 700,
                color: '#EEF2FF', marginBottom: 14,
                lineHeight: 1.4, margin: '0 0 14px',
            }}>
                {p.question || 'What matters most to you?'}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map(opt => {
                    const pct = totalVotes > 0
                        ? Math.round((voteCounts[opt] / totalVotes) * 100) : 0
                    const isSelected = selected === opt

                    return (
                        <button
                            key={opt}
                            onClick={() => handleVote(opt)}
                            disabled={submitted}
                            style={{
                                position: 'relative',
                                background: isSelected
                                    ? `${color}22`
                                    : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${isSelected ? color : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: 10,
                                padding: '10px 14px',
                                color: '#EEF2FF',
                                fontSize: 13,
                                fontWeight: isSelected ? 700 : 400,
                                textAlign: 'left',
                                cursor: submitted ? 'default' : 'pointer',
                                overflow: 'hidden',
                                transition: 'all 0.2s',
                            }}
                        >
                            {/* Results bar */}
                            {showResults && (
                                <div style={{
                                    position: 'absolute', left: 0, top: 0,
                                    height: '100%',
                                    width: `${pct}%`,
                                    background: isSelected ? `${color}33` : 'rgba(255,255,255,0.06)',
                                    transition: 'width 0.6s ease',
                                    borderRadius: 9,
                                }} />
                            )}
                            <span style={{ position: 'relative', zIndex: 1 }}>
                                {isSelected && '✓ '}{opt}
                            </span>
                            {showResults && (
                                <span style={{
                                    position: 'absolute', right: 12, top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: 11, fontWeight: 700,
                                    color: isSelected ? color : 'rgba(255,255,255,0.4)',
                                    zIndex: 1,
                                }}>
                                    {pct}%
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Error */}
            {submitError && (
                <div style={{
                    marginTop: 10, padding: '8px 12px',
                    background: 'rgba(255,107,107,0.12)',
                    border: '1px solid rgba(255,107,107,0.3)',
                    borderRadius: 8, fontSize: 12, color: '#FF6B6B',
                }}>
                    {submitError}
                </div>
            )}

            {/* Submit / Results */}
            {!submitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={!selected || isSubmitting}
                    style={{
                        marginTop: 14, width: '100%',
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
                    {isSubmitting ? '⏳ Submitting…' : (p.buttonText || 'Submit Answer')}
                </button>
            ) : (
                <div style={{
                    marginTop: 14, textAlign: 'center',
                    fontSize: 12, color: 'rgba(255,255,255,0.45)',
                }}>
                    ✓ Thanks for voting!
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