'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { buildFingerprint } from '@/lib/fingerprint'
import { isGateCompleted, markGateCompleted } from '@/lib/gateStorage'
import LeadCaptureForm from './LeadCaptureForm'
import BookingGate from './BookingGate'
import DownloadGate from './DownloadGate'
import UrgencyGate from './UrgencyGate'
import { setViewerEmailCookie } from '@/lib/viewerIdentity'

// ── Which gate component to render ───────────────────────────────────────────
function GateContent({ type, el, onSubmit, onSkip, skipAvailable, isSubmitting, submitError }) {
    const props = { el, onSubmit, onSkip, skipAvailable, isSubmitting, submitError }
    switch (type) {
        case 'cta-email': return <LeadCaptureForm {...props} />
        case 'cta-booking': return <BookingGate     {...props} />
        case 'cta-download': return <DownloadGate    {...props} />
        case 'funnel-urgency': return <UrgencyGate   {...props} />
        default: return <LeadCaptureForm {...props} />
    }
}

export default function GateOverlay({
    el,                  // full element object with gate config
    videoId,
    workspaceId,
    playerRef,
    currentTimeRef,      // ref to current playback time
    onGateDismissed,     // callback when gate is done (submitted or skipped)
    viewerIdentityRef,
}) {
    const gate = el.gate || {}
    const p = el.props || {}

    const [visible, setVisible] = useState(false)
    const [skipAvailable, setSkipAvailable] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)
    const [phase, setPhase] = useState('idle') // idle|active|success|dismissed
    const skipTimerRef = useRef(null)
    const fpRef = useRef(null)

    // ── Build fingerprint once on mount ──────────────────────────────────────
    useEffect(() => {
        fpRef.current = buildFingerprint()
    }, [])

    // ── Pause Cloudflare iframe via postMessage ───────────────────────────────
    const pauseVideo = useCallback(() => {
        try { playerRef?.current?.pause() } catch { }
    }, [playerRef])

    const playVideo = useCallback(() => {
        try { playerRef?.current?.play() } catch { }
    }, [playerRef])

    // ── Activate gate ─────────────────────────────────────────────────────────
    useEffect(() => {
        // Check if already completed in localStorage
        if (isGateCompleted(el.id)) {
            onGateDismissed?.(el.id, 'auto-skipped')
            return
        }

        // Small delay to allow fade-in animation
        const t = setTimeout(() => {
            setVisible(true)
            setPhase('active')
            pauseVideo()

            // Start skip countdown if allowSkip is enabled
            if (gate.allowSkip && gate.skipDelay > 0) {
                skipTimerRef.current = setTimeout(() => {
                    setSkipAvailable(true)
                }, gate.skipDelay * 1000)
            } else if (gate.allowSkip) {
                setSkipAvailable(true)
            }
        }, 80)

        return () => {
            clearTimeout(t)
            clearTimeout(skipTimerRef.current)
        }
    }, []) // eslint-disable-line

    // ── Submit lead ───────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (formData) => {
        setIsSubmitting(true)
        setSubmitError(null)
        const lid = viewerIdentityRef?.current?.lid || null
        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspace_id: workspaceId,
                    video_id: videoId,
                    element_id: el.id,
                    email: formData.email,
                    name: formData.name || null,
                    phone: formData.phone || null,
                    watch_depth_pct: currentTimeRef?.current
                        ? Math.round((currentTimeRef.current / (el.duration || 1)) * 100)
                        : null,
                    visitor_fingerprint: fpRef.current,
                    source_url: typeof window !== 'undefined' ? window.location.href : null,
                    lid,
                }),
            })

            const json = await res.json()

            if (!res.ok) {
                setSubmitError(json.error || 'Something went wrong. Please try again.')
                setIsSubmitting(false)
                return
            }

            // ── Success ───────────────────────────────────────────────────────
            setPhase('success')
            markGateCompleted(el.id)

            if (formData.email) {
                setViewerEmailCookie(formData.email)
            }
            // Resume video after 1.5s
            setTimeout(() => {
                setVisible(false)
                playVideo()
                onGateDismissed?.(el.id, 'submitted')
            }, 1500)

        } catch {
            setSubmitError('Network error. Please check your connection and try again.')
            setIsSubmitting(false)
        }
    }, [workspaceId, videoId, el.id, currentTimeRef, playVideo, onGateDismissed])

    // ── Skip (no lead) ────────────────────────────────────────────────────────
    const handleSkip = useCallback(() => {
        markGateCompleted(el.id)
        setVisible(false)
        playVideo()
        onGateDismissed?.(el.id, 'skipped')
    }, [el.id, playVideo, onGateDismissed])

    if (!visible) return null

    return (
        <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Blurred video behind gate
            backdropFilter: 'blur(12px) brightness(0.4)',
            WebkitBackdropFilter: 'blur(12px) brightness(0.4)',
            background: 'rgba(7, 9, 15, 0.65)',
            animation: 'gate-in 0.3s ease',
            padding: 16,
            boxSizing: 'border-box',
            pointerEvents: 'all',
        }}>
            {phase === 'success' ? (
                // ── Success state ─────────────────────────────────────────────
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 12,
                    animation: 'gate-in 0.25s ease',
                }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1ED8A0, #0BB87A)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28,
                        boxShadow: '0 8px 32px rgba(30,216,160,0.4)',
                    }}>
                        ✓
                    </div>
                    <p style={{
                        color: '#fff', fontWeight: 700, fontSize: 16,
                        margin: 0, textAlign: 'center',
                    }}>
                        {gate.successMessage || "You're in! Resuming now…"}
                    </p>
                </div>
            ) : (
                <GateContent
                    type={el.type}
                    el={el}
                    onSubmit={handleSubmit}
                    onSkip={handleSkip}
                    skipAvailable={skipAvailable}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                />
            )}

            <style>{`
                @keyframes gate-in {
                    from { opacity: 0; transform: scale(0.96); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    )
}