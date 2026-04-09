'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { buildFingerprint } from '@/lib/fingerprint'
import { isGateCompleted, markGateCompleted } from '@/lib/gateStorage'
import { useInteractionTracker } from '@/lib/useInteractionTracker'
import PollOverlay from './PollOverlay'
import RatingOverlay from './RatingOverlay'
import NpsOverlay from './NpsOverlay'

function SurveyContent({ type, el, onSubmit, onDismiss, isGated, isSubmitting, submitError }) {
    const props = { el, onSubmit, onDismiss, isGated, isSubmitting, submitError }
    switch (type) {
        case 'survey-poll': return <PollOverlay   {...props} />
        case 'survey-rating': return <RatingOverlay {...props} />
        case 'survey-nps': return <NpsOverlay    {...props} />
        default: return null
    }
}

// ── Interaction type map ───────────────────────────────────────────────────────
const INTERACTION_TYPE = {
    'survey-poll': 'poll_voted',
    'survey-rating': 'rating_submitted',
    'survey-nps': 'rating_submitted',
}

export default function SurveyOverlay({
    el,
    videoId,
    workspaceId,
    playerRef,
    currentTimeRef,
    isGated = false,
    onDismissed,     // callback(elementId, reason)
}) {
    const gate = el.gate || {}
    const p = el.props || {}

    const [visible, setVisible] = useState(false)
    const [phase, setPhase] = useState('idle') // idle|active|success
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)
    const fpRef = useRef(null)

    const { trackInteraction } = useInteractionTracker({ workspaceId, videoId })

    useEffect(() => { fpRef.current = buildFingerprint() }, [])

    // ── Pause helpers ─────────────────────────────────────────────────────────
    const pauseVideo = useCallback(() => {
        try { playerRef?.current?.pause() } catch { }
    }, [playerRef])

    const playVideo = useCallback(() => {
        try { playerRef?.current?.play() } catch { }
    }, [playerRef])

    // ── Mount: check completion, show, maybe pause ────────────────────────────
    useEffect(() => {
        if (isGated && isGateCompleted(el.id)) {
            onDismissed?.(el.id, 'auto-skipped')
            return
        }

        const t = setTimeout(() => {
            setVisible(true)
            setPhase('active')
            if (isGated) pauseVideo()
        }, 80)

        return () => clearTimeout(t)
    }, []) // eslint-disable-line

    // ── Submit handler ────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (value) => {
        setIsSubmitting(true)
        setSubmitError(null)

        const interactionType = INTERACTION_TYPE[el.type] || 'choice_selected'

        try {
            // 1. Track interaction (always)
            await trackInteraction({
                elementId: el.id,
                interactionType,
                value: {
                    answer: value,
                    element_type: el.type,
                    question: p.question || '',
                    at_seconds: Math.round(currentTimeRef?.current ?? 0),
                },
            })

            // 2. If gated — also save lead with survey response
            if (isGated) {
                const res = await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        workspace_id: workspaceId,
                        video_id: videoId,
                        element_id: el.id,
                        email: `survey_${Date.now()}@noemail.internal`,
                        watch_depth_pct: Math.round(currentTimeRef?.current ?? 0),
                        visitor_fingerprint: fpRef.current,
                        source_url: typeof window !== 'undefined' ? window.location.href : null,
                        responses: [{
                            element_id: el.id,
                            type: el.type,
                            value,
                            at: Math.round(currentTimeRef?.current ?? 0),
                        }],
                    }),
                })
                if (!res.ok) {
                    const j = await res.json()
                    // Non-fatal — still show success
                    console.warn('[SurveyOverlay] lead save failed:', j.error)
                }
            }

            // 3. Success
            setPhase('success')
            if (isGated) markGateCompleted(el.id)

            setTimeout(() => {
                setVisible(false)
                if (isGated) playVideo()
                onDismissed?.(el.id, 'submitted')
            }, 1500)

        } catch (err) {
            console.error('[SurveyOverlay] submit error:', err)
            setSubmitError('Something went wrong. Please try again.')
            setIsSubmitting(false)
        }
    }, [el, workspaceId, videoId, isGated, currentTimeRef, trackInteraction, playVideo, onDismissed])

    // ── Dismiss (non-gated only) ──────────────────────────────────────────────
    const handleDismiss = useCallback(() => {
        setVisible(false)
        onDismissed?.(el.id, 'dismissed')
        trackInteraction({ elementId: el.id, interactionType: 'dismissed', value: {} })
    }, [el.id, onDismissed, trackInteraction])

    if (!visible) return null

    // ── Gated surveys use full-screen blur overlay ────────────────────────────
    const wrapperStyle = isGated ? {
        position: 'absolute', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(12px) brightness(0.4)',
        WebkitBackdropFilter: 'blur(12px) brightness(0.4)',
        background: 'rgba(7,9,15,0.65)',
        animation: 'survey-in 0.3s ease',
        padding: 16, boxSizing: 'border-box',
        pointerEvents: 'all',
    } : {
        // Non-gated: positioned overlay on video
        position: 'absolute', zIndex: 50,
        bottom: 16, left: '50%',
        transform: 'translateX(-50%)',
        animation: 'survey-in 0.3s ease',
        pointerEvents: 'all',
        width: '90%', maxWidth: 400,
    }

    return (
        <div onClick={e => e.stopPropagation()} style={wrapperStyle}>
            {phase === 'success' ? (
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 12,
                    animation: 'survey-in 0.25s ease',
                }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#1ED8A0,#0BB87A)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 28,
                        boxShadow: '0 8px 32px rgba(30,216,160,0.4)',
                    }}>
                        ✓
                    </div>
                    <p style={{
                        color: '#fff', fontWeight: 700,
                        fontSize: 15, margin: 0, textAlign: 'center',
                    }}>
                        {gate.successMessage || 'Thanks for your response!'}
                    </p>
                </div>
            ) : (
                <SurveyContent
                    type={el.type}
                    el={el}
                    onSubmit={handleSubmit}
                    onDismiss={handleDismiss}
                    isGated={isGated}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                />
            )}

            <style>{`
                @keyframes survey-in {
                    from { opacity: 0; transform: scale(0.96); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    )
}