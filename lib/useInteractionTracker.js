import { useCallback, useRef } from 'react'
import { buildFingerprint } from '@/lib/fingerprint'

/**
 * Lightweight hook — call trackInteraction() anywhere to POST
 * an event to /api/element-interactions without blocking the UI.
 */
export function useInteractionTracker({ workspaceId, videoId }) {
    const fpRef = useRef(null)

    // Build fingerprint lazily on first use
    function getFp() {
        if (!fpRef.current) fpRef.current = buildFingerprint()
        return fpRef.current
    }

    const trackInteraction = useCallback(async ({
        elementId,
        interactionType,
        value = {},
    }) => {
        if (!workspaceId || !videoId) return
        try {
            await fetch('/api/element-interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspace_id: workspaceId,
                    video_id: videoId,
                    element_id: elementId,
                    interaction_type: interactionType,
                    value,
                    visitor_fingerprint: getFp(),
                }),
            })
        } catch (err) {
            console.warn('[trackInteraction] failed silently:', err)
        }
    }, [workspaceId, videoId])

    return { trackInteraction }
}