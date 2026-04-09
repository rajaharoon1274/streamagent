'use client'
import { useState } from 'react'

/**
 * ChoicePointOverlay
 * - Always pauses video (called by OverlayRenderer before mount)
 * - Shows choice cards
 * - On select → calls onChoiceSelected(choiceId, choiceText)
 * - Handles routing externally via WatchClient
 */
export default function ChoicePointOverlay({
    el,
    onChoiceSelected,   // async (choiceId, choiceText) => void
    isSubmitting = false,
}) {
    const p = el.props || {}
    const choices = Array.isArray(p.choices) ? p.choices : [
        { id: 'c1', text: 'Option 1', color: '#4F6EF7' },
        { id: 'c2', text: 'Option 2', color: '#A855F7' },
    ]
    const layout = p.layout || 'grid'

    const [selected, setSelected] = useState(null)

    async function handleSelect(choice) {
        if (isSubmitting || selected) return
        setSelected(choice.id)
        await onChoiceSelected?.(choice.id, choice.text)
    }

    return (
        <div style={{
            position: 'absolute', inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(14px) brightness(0.35)',
            WebkitBackdropFilter: 'blur(14px) brightness(0.35)',
            background: 'rgba(7,9,15,0.7)',
            padding: 20,
            boxSizing: 'border-box',
            animation: 'cp-in 0.3s ease',
            pointerEvents: 'all',
        }}>
            <div style={{
                width: '100%',
                maxWidth: 520,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
            }}>

                {/* ── Question ── */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 11, fontWeight: 700,
                        color: '#4F6EF7',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: 10,
                        background: 'rgba(79,110,247,0.15)',
                        padding: '4px 12px',
                        borderRadius: 20,
                        display: 'inline-block',
                        border: '1px solid rgba(79,110,247,0.3)',
                    }}>
                        🔀 Choose Your Path
                    </div>
                    <h2 style={{
                        fontSize: 'clamp(16px, 3vw, 22px)',
                        fontWeight: 800,
                        color: '#fff',
                        margin: 0,
                        lineHeight: 1.3,
                        textAlign: 'center',
                    }}>
                        {p.question || 'What would you like to do next?'}
                    </h2>
                </div>

                {/* ── Choice Cards ── */}
                <div style={{
                    display: layout === 'grid' ? 'grid' : 'flex',
                    gridTemplateColumns: layout === 'grid'
                        ? `repeat(${Math.min(choices.length, 3)}, 1fr)`
                        : undefined,
                    flexDirection: layout === 'list' ? 'column' : undefined,
                    gap: 12,
                    width: '100%',
                }}>
                    {choices.map((choice, i) => {
                        const color = choice.color || '#4F6EF7'
                        const isActive = selected === choice.id
                        const isLoading = isActive && isSubmitting
                        const isDimmed = selected && selected !== choice.id

                        return (
                            <button
                                key={choice.id}
                                onClick={() => handleSelect(choice)}
                                disabled={!!selected || isSubmitting}
                                style={{
                                    position: 'relative',
                                    background: isActive
                                        ? `linear-gradient(135deg, ${color}, ${color}cc)`
                                        : 'rgba(255,255,255,0.06)',
                                    border: `2px solid ${isActive
                                        ? color
                                        : isDimmed
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'rgba(255,255,255,0.15)'}`,
                                    borderRadius: 14,
                                    padding: '18px 16px',
                                    color: isDimmed ? 'rgba(255,255,255,0.3)' : '#fff',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    cursor: selected ? 'default' : 'pointer',
                                    transition: 'all 0.2s',
                                    transform: isActive ? 'scale(1.03)' : 'scale(1)',
                                    boxShadow: isActive
                                        ? `0 8px 24px ${color}55`
                                        : 'none',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Number badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: 8, left: 10,
                                    fontSize: 10,
                                    fontWeight: 900,
                                    color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                                }}>
                                    {i + 1}
                                </div>

                                {/* Color dot */}
                                <div style={{
                                    width: 8, height: 8,
                                    borderRadius: '50%',
                                    background: isActive ? 'rgba(255,255,255,0.6)' : color,
                                    margin: '0 auto 10px',
                                    transition: 'background 0.2s',
                                }} />

                                {isLoading ? (
                                    <div style={{
                                        width: 18, height: 18,
                                        borderRadius: '50%',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTop: '2px solid #fff',
                                        animation: 'cp-spin 0.7s linear infinite',
                                        margin: '0 auto',
                                    }} />
                                ) : (
                                    <span>{choice.text}</span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* ── Skip link (if allowSkip) ── */}
                {p.allowSkip && !selected && (
                    <button
                        onClick={() => onChoiceSelected?.(null, null)}
                        style={{
                            background: 'none', border: 'none',
                            color: 'rgba(255,255,255,0.25)',
                            fontSize: 12, cursor: 'pointer',
                            textDecoration: 'underline',
                            marginTop: -8,
                        }}
                    >
                        Skip for now →
                    </button>
                )}
            </div>

            <style>{`
                @keyframes cp-in {
                    from { opacity: 0; transform: scale(0.97); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes cp-spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}