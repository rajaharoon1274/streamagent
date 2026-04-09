'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import OverlayText from './OverlayText'
import CtaButton from './CtaButton'
import AnnotationLink from './AnnotationLink'
import ImageClickable from './ImageClickable'
import OverlayChapter from './OverlayChapter'
import OverlayCountdown from './OverlayCountdown'
import StickyBar from './StickyBar'
import ShareSocial from './ShareSocial'
import GateOverlay from '../gates/GateOverlay'
import SurveyOverlay from '../surveys/SurveyOverlay'
import ChoicePointOverlay from '../gates/ChoicePointOverlay'
import MobCall from '../mobile/MobCall'
import MobSms from '../mobile/MobSms'
import MobShare from '../mobile/MobShare'
import MobVcard from '../mobile/MobVcard'
import MobCalendar from '../mobile/MobCalendar'
import MobDirections from '../mobile/MobDirections'
import MobSwipe from '../mobile/MobSwipe'
import MobScreenshot from '../mobile/MobScreenshot'
import MobShake from '../mobile/MobShake'
import { shouldShowElement } from '@/lib/deviceDetect'
import { useInteractionTracker } from '@/lib/useInteractionTracker'

// ── Element type sets ─────────────────────────────────────────────────────────
const GATE_TYPES = new Set(['cta-email', 'cta-booking', 'cta-download', 'funnel-urgency'])
const SURVEY_TYPES = new Set(['survey-poll', 'survey-rating', 'survey-nps'])
const MOBILE_TYPES = new Set(['mob-call', 'mob-sms', 'mob-share', 'mob-vcard', 'mob-calendar', 'mob-directions', 'mob-swipe', 'mob-screenshot', 'mob-shake'])
const CHOICE_TYPES = new Set(['choice-point'])

// ── Animation definitions ─────────────────────────────────────────────────────
const ANIM_IN = {
    fadeIn: { from: { opacity: 0, transform: 'none' }, to: { opacity: 1, transform: 'none' } },
    slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0px)' } },
    slideDown: { from: { opacity: 0, transform: 'translateY(-20px)' }, to: { opacity: 1, transform: 'translateY(0px)' } },
    slideLeft: { from: { opacity: 0, transform: 'translateX(30px)' }, to: { opacity: 1, transform: 'translateX(0px)' } },
    slideRight: { from: { opacity: 0, transform: 'translateX(-30px)' }, to: { opacity: 1, transform: 'translateX(0px)' } },
    scale: { from: { opacity: 0, transform: 'scale(0.7)' }, to: { opacity: 1, transform: 'scale(1)' } },
    bounce: { from: { opacity: 0, transform: 'scale(0.5)' }, to: { opacity: 1, transform: 'scale(1)' } },
    none: { from: { opacity: 1, transform: 'none' }, to: { opacity: 1, transform: 'none' } },
}
const ANIM_OUT = {
    fadeOut: { to: { opacity: 0, transform: 'none' } },
    slideUp: { to: { opacity: 0, transform: 'translateY(-20px)' } },
    slideDown: { to: { opacity: 0, transform: 'translateY(20px)' } },
    slideLeft: { to: { opacity: 0, transform: 'translateX(-30px)' } },
    slideRight: { to: { opacity: 0, transform: 'translateX(30px)' } },
    scale: { to: { opacity: 0, transform: 'scale(0.7)' } },
    none: { to: { opacity: 0, transform: 'none' } },
}

// ── Mobile element component map ──────────────────────────────────────────────
function MobileContent({ el }) {
    switch (el.type) {
        case 'mob-call': return <MobCall el={el} />
        case 'mob-sms': return <MobSms el={el} />
        case 'mob-share': return <MobShare el={el} />
        case 'mob-vcard': return <MobVcard el={el} />
        case 'mob-calendar': return <MobCalendar el={el} />
        case 'mob-directions': return <MobDirections el={el} />
        case 'mob-swipe': return <MobSwipe el={el} />
        case 'mob-screenshot': return <MobScreenshot el={el} />
        case 'mob-shake': return <MobShake el={el} />
        default: return null
    }
}

// ── Standard overlay component map ───────────────────────────────────────────
function ElementContent({ el }) {
    switch (el.type) {
        case 'overlay-text': return <OverlayText el={el} />
        case 'cta-button': return <CtaButton el={el} />
        case 'annotation-link': return <AnnotationLink el={el} />
        case 'image-clickable': return <ImageClickable el={el} />
        case 'overlay-chapter': return <OverlayChapter el={el} />
        case 'overlay-countdown': return <OverlayCountdown el={el} />
        case 'sticky-bar': return <StickyBar el={el} />
        case 'share-social': return <ShareSocial el={el} />
        default: return null
    }
}

// ── isActive: for normal + mobile overlays only ───────────────────────────────
function isActive(el, t) {
    const inTime = el.timing?.in ?? 0
    const duration = el.timing?.duration ?? 0
    if (t < inTime) return false
    if (duration > 0 && t >= inTime + duration) return false
    return true
}

// ── Animated wrapper for normal + mobile overlays ─────────────────────────────
function AnimatedElement({ el, videoW, videoH, workspaceId, videoId }) {
    const [animStyle, setAnimStyle] = useState({})
    const [transition, setTransition] = useState('none')
    const exitTimer = useRef(null)

    const { trackInteraction } = useInteractionTracker({ workspaceId, videoId })

    const p = el.props || {}
    const timing = el.timing || {}
    const animSpeed = parseFloat(timing.animSpeed ?? 0.4)
    const duration = timing.duration > 0 ? timing.duration * 1000 : null
    const isMob = MOBILE_TYPES.has(el.type)
    const isClickable = !!p.url || el.type === 'share-social' || el.type === 'cta-button' || isMob

    const animInKey = timing.animIn || 'fadeIn'
    const animOutKey = timing.animOut || 'fadeOut'
    const animInDef = ANIM_IN[animInKey] || ANIM_IN.fadeIn
    const animOutDef = ANIM_OUT[animOutKey] || ANIM_OUT.fadeOut
    const bounceEasing = animInKey === 'bounce'
        ? 'cubic-bezier(0.34,1.56,0.64,1)'
        : 'cubic-bezier(0.22,0.61,0.36,1)'

    // ── Position ──────────────────────────────────────────────────────────────
    const isSticky = el.type === 'sticky-bar'
    const stickyPos = p.position || 'bottom'
    let posStyle = {}

    if (isSticky) {
        posStyle = {
            position: 'absolute',
            left: '3%', width: '94%',
            height: Math.max(36, Math.round((el.h / 100) * videoH)),
            zIndex: el.z_index ?? 30,
            ...(stickyPos === 'top' ? { top: 8 } : { bottom: 8 }),
        }
    } else if (isMob) {
        posStyle = {
            position: 'absolute',
            bottom: 56,
            left: '50%',
            transform: 'translateX(-50%)',
            width: Math.min(videoW * 0.85, 360),
            zIndex: el.z_index ?? 40,
        }
    } else {
        posStyle = {
            position: 'absolute',
            left: Math.round((el.x / 100) * videoW),
            top: Math.round((el.y / 100) * videoH),
            width: Math.round((el.w / 100) * videoW),
            height: Math.max(28, Math.round((el.h / 100) * videoH)),
            zIndex: el.z_index ?? 10,
        }
    }

    useEffect(() => {
        setAnimStyle(animInDef.from)
        setTransition('none')
        const rafId = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTransition(`opacity ${animSpeed}s ${bounceEasing}, transform ${animSpeed}s ${bounceEasing}`)
                setAnimStyle(animInDef.to)
            })
        })
        if (duration) {
            exitTimer.current = setTimeout(() => {
                setTransition(`opacity ${animSpeed}s ease-in, transform ${animSpeed}s ease-in`)
                setAnimStyle(animOutDef.to)
            }, duration - animSpeed * 1000)
        }
        return () => { cancelAnimationFrame(rafId); clearTimeout(exitTimer.current) }
    }, []) // eslint-disable-line

    const content = isMob ? MobileContent({ el }) : ElementContent({ el })
    if (!content) return null

    return (
        <div
            onClick={() => {
                if (p.url) {
                    window.open(p.url, p.openNewTab !== false ? '_blank' : '_self')
                    trackInteraction({
                        elementId: el.id,
                        interactionType: 'clicked',
                        value: { url: p.url },
                    })
                }
            }}
            style={{
                ...posStyle,
                opacity: el.opacity ?? 1,
                pointerEvents: isClickable ? 'auto' : 'none',
                cursor: p.url ? 'pointer' : 'default',
                willChange: 'transform, opacity',
                overflow: isMob ? 'visible' : 'hidden',
                ...animStyle,
                transition,
            }}
        >
            {content}
        </div>
    )
}

// ── Main OverlayRenderer ──────────────────────────────────────────────────────
export default function OverlayRenderer({
    elements = [],
    currentTimeRef,
    containerRef,
    videoId,
    workspaceId,
    playerRef,
    viewerIdentityRef,
    onRouteSwap,        // ← Day 8: route swap callback
}) {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [dismissedGates, setDismissedGates] = useState(new Set())
    const [triggeredGates, setTriggeredGates] = useState(new Set())
    const [activeIds, setActiveIds] = useState(new Set())
    const [sessionKey, setSessionKey] = useState(0)

    // ── Choice point state ────────────────────────────────────────────────────
    const [triggeredChoices, setTriggeredChoices] = useState(new Set())
    const [dismissedChoices, setDismissedChoices] = useState(new Set())
    const [submittingChoice, setSubmittingChoice] = useState(null)

    const lastTimeRef = useRef(0)
    const firedGatesRef = useRef(new Set())
    const rafRef = useRef(null)

    const { trackInteraction } = useInteractionTracker({ workspaceId, videoId })

    const handleDismissed = useCallback((elementId) => {
        setDismissedGates(prev => new Set([...prev, elementId]))
    }, [])

    // ── Container size ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef?.current) return
        const obs = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect
            setDimensions({ width, height })
        })
        obs.observe(containerRef.current)
        return () => obs.disconnect()
    }, [containerRef])

    // ── Main RAF loop ─────────────────────────────────────────────────────────
    useEffect(() => {
        function tick() {
            const t = currentTimeRef?.current ?? 0

            // ── Replay detection ──────────────────────────────────────────────
            if (lastTimeRef.current > 1 && t < 0.3) {
                console.log('[OverlayRenderer] Replay — resetting all triggers')
                firedGatesRef.current = new Set()
                setSessionKey(k => k + 1)
                setTriggeredGates(new Set())
                setDismissedGates(new Set())
                setTriggeredChoices(new Set())
                setDismissedChoices(new Set())
            }
            lastTimeRef.current = t

            // ── Gate + survey gate trigger (one-shot) ─────────────────────────
            for (const el of elements) {
                const isGateable = GATE_TYPES.has(el.type) || SURVEY_TYPES.has(el.type)
                if (
                    isGateable &&
                    el.gate?.enabled === true &&
                    !firedGatesRef.current.has(el.id) &&
                    t >= (el.timing?.in ?? 0)
                ) {
                    console.log('[OverlayRenderer] Gate triggered:', el.id)
                    firedGatesRef.current.add(el.id)
                    setTriggeredGates(prev => new Set([...prev, el.id]))
                }
            }

            // ── Choice point trigger (one-shot) ───────────────────────────────
            for (const el of elements) {
                if (
                    CHOICE_TYPES.has(el.type) &&
                    !firedGatesRef.current.has(el.id) &&
                    t >= (el.timing?.in ?? 0)
                ) {
                    console.log('[OverlayRenderer] Choice point triggered:', el.id, 'at t=', t.toFixed(2))
                    firedGatesRef.current.add(el.id)
                    setTriggeredChoices(prev => new Set([...prev, el.id]))
                    // Always pause immediately
                    try { playerRef?.current?.pause() } catch { }
                }
            }

            // ── Normal overlay active check ───────────────────────────────────
            setActiveIds(prev => {
                const next = new Set()
                for (const el of elements) {
                    const isGateable = GATE_TYPES.has(el.type) || SURVEY_TYPES.has(el.type)
                    if (isGateable && el.gate?.enabled === true) continue
                    if (CHOICE_TYPES.has(el.type)) continue
                    if (MOBILE_TYPES.has(el.type) && !shouldShowElement(el)) continue
                    if (isActive(el, t)) next.add(el.id)
                }
                const same = next.size === prev.size && [...next].every(id => prev.has(id))
                return same ? prev : next
            })

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
    }, [elements, currentTimeRef]) // eslint-disable-line

    // ── Choice selection handler ──────────────────────────────────────────────
    const handleChoiceSelected = useCallback(async (el, choiceId, choiceText) => {
        setSubmittingChoice(el.id)

        // 1. Track interaction
        await trackInteraction({
            elementId: el.id,
            interactionType: 'choice_selected',
            value: {
                choice_id: choiceId,
                choice_text: choiceText,
                element_type: 'choice-point',
                at_seconds: Math.round(currentTimeRef?.current ?? 0),
            },
        })

        // 2. Skip (allowSkip tapped) → resume
        if (!choiceId) {
            try { playerRef?.current?.play() } catch { }
            setDismissedChoices(prev => new Set([...prev, el.id]))
            setSubmittingChoice(null)
            return
        }

        // 3. Resolve route edge
        try {
            const res = await fetch(
                `/api/routes/resolve?workspace_id=${workspaceId}&element_id=${el.id}&choice_value=${encodeURIComponent(choiceId)}`
            )
            const data = await res.json()

            if (data.target_video_id) {
                // ── TC-05: Route found → swap video ───────────────────────────
                console.log('[OverlayRenderer] Routing to video:', data.target_video_id)
                setDismissedChoices(prev => new Set([...prev, el.id]))
                await onRouteSwap?.(data.target_video_id)
            } else {
                // ── TC-05: No route → resume current video ────────────────────
                console.log('[OverlayRenderer] No route for this choice — resuming')
                try { playerRef?.current?.play() } catch { }
                setDismissedChoices(prev => new Set([...prev, el.id]))
            }
        } catch (err) {
            console.error('[OverlayRenderer] Route resolve error:', err)
            try { playerRef?.current?.play() } catch { }
            setDismissedChoices(prev => new Set([...prev, el.id]))
        }

        setSubmittingChoice(null)
    }, [workspaceId, currentTimeRef, playerRef, onRouteSwap, trackInteraction])

    if (!dimensions.width) return null

    // ── Derived render lists ──────────────────────────────────────────────────
    const activeElements = elements
        .filter(el => {
            const isGateable = GATE_TYPES.has(el.type) || SURVEY_TYPES.has(el.type)
            if (isGateable && el.gate?.enabled === true) return false
            if (CHOICE_TYPES.has(el.type)) return false
            return activeIds.has(el.id)
        })
        .sort((a, b) => (a.z_index ?? 1) - (b.z_index ?? 1))

    const activeSurveys = elements.filter(el =>
        SURVEY_TYPES.has(el.type) &&
        el.gate?.enabled !== true &&
        activeIds.has(el.id) &&
        !dismissedGates.has(el.id)
    )

    const activeGates = elements.filter(el => {
        const isGateable = GATE_TYPES.has(el.type) || SURVEY_TYPES.has(el.type)
        return isGateable &&
            el.gate?.enabled === true &&
            triggeredGates.has(el.id) &&
            !dismissedGates.has(el.id)
    })

    const activeChoicePoints = elements.filter(el =>
        CHOICE_TYPES.has(el.type) &&
        triggeredChoices.has(el.id) &&
        !dismissedChoices.has(el.id)
    )

    const hasBlockingOverlay =
        activeSurveys.length > 0 ||
        activeGates.length > 0 ||
        activeChoicePoints.length > 0

    return (
        <>
            {/* ── Standard + mobile overlays ── */}
            {activeElements
                .filter(el => !(MOBILE_TYPES.has(el.type) && hasBlockingOverlay))
                .map(el => (
                    <AnimatedElement
                        key={`${sessionKey}-${el.id}`}
                        el={el}
                        videoW={dimensions.width}
                        videoH={dimensions.height}
                        workspaceId={workspaceId}
                        videoId={videoId}
                    />
                ))
            }

            {/* ── Non-gated surveys ── */}
            {activeSurveys.map(el => (
                <SurveyOverlay
                    key={`${sessionKey}-${el.id}-survey`}
                    el={el}
                    videoId={videoId}
                    workspaceId={workspaceId}
                    playerRef={playerRef}
                    currentTimeRef={currentTimeRef}
                    isGated={false}
                    onDismissed={handleDismissed}
                />
            ))}

            {/* ── Gated overlays (gates + gated surveys) ── */}
            {activeGates.map(el => {
                if (SURVEY_TYPES.has(el.type)) {
                    return (
                        <SurveyOverlay
                            key={`${sessionKey}-${el.id}-gate`}
                            el={el}
                            videoId={videoId}
                            workspaceId={workspaceId}
                            playerRef={playerRef}
                            currentTimeRef={currentTimeRef}
                            isGated={true}
                            onDismissed={handleDismissed}
                        />
                    )
                }
                return (
                    <GateOverlay
                        key={`${sessionKey}-${el.id}-gate`}
                        el={el}
                        videoId={videoId}
                        workspaceId={workspaceId}
                        playerRef={playerRef}
                        currentTimeRef={currentTimeRef}
                        onGateDismissed={handleDismissed}
                    />
                )
            })}

            {/* ── Choice Points — always on very top (z:100) ── */}
            {activeChoicePoints.map(el => (
                <ChoicePointOverlay
                    key={`${sessionKey}-${el.id}-choice`}
                    el={el}
                    isSubmitting={submittingChoice === el.id}
                    onChoiceSelected={(choiceId, choiceText) =>
                        handleChoiceSelected(el, choiceId, choiceText)
                    }
                />
            ))}
        </>
    )
}