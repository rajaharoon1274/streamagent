import { useCallback } from 'react'

/**
 * useRouteResolver
 * Given a choice selection on an element, looks up the matching route_edge
 * and returns the target video_id (or null if no matching edge = resume).
 */
export function useRouteResolver({ workspaceId }) {

    const resolveRoute = useCallback(async ({
        elementId,
        choiceValue,
    }) => {
        if (!elementId || !workspaceId) return null

        try {
            const res = await fetch(
                `/api/routes/resolve?workspace_id=${workspaceId}&element_id=${elementId}&choice_value=${encodeURIComponent(choiceValue || '')}`
            )
            if (!res.ok) return null
            const data = await res.json()
            return data.target_video_id || null
        } catch {
            return null
        }
    }, [workspaceId])

    return { resolveRoute }
}