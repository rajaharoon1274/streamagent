import useSWR from 'swr'

const fetcher = (url) =>
    fetch(url).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
    })

// ─── Normalize a DB route row → canvas node shape ─────────────────────────────
export function dbToNode(r) {
    if (!r) return r
    return {
        id: r.id,
        videoId: r.video_id || null,
        title: r.title || 'Untitled',
        color: r.color || '#4F6EF7',
        x: r.x ?? 300,
        y: r.y ?? 180,
        duration: r.duration ?? 240,
        isRoot: r.is_root ?? false,
        choicePoints: Array.isArray(r.choice_points) ? r.choice_points : [],
        ctaPoints: Array.isArray(r.cta_points) ? r.cta_points : [],
        landingPage: r.landing_page || {},
        // keep raw DB fields too
        workspace_id: r.workspace_id,
        created_at: r.created_at,
        updated_at: r.updated_at,
    }
}

// ─── Normalize a DB video row → palette video shape ───────────────────────────
export function dbToVideo(v) {
    if (!v) return v
    const dur = v.duration_seconds
        ? `${Math.floor(v.duration_seconds / 60)}:${String(v.duration_seconds % 60).padStart(2, '0')}`
        : v.dur || '0:00'
    return {
        ...v,
        dur,
        views: v.views ?? 0,
        eng: v.eng ?? 0,
        color: v.color || '#4F6EF7',
        aspectRatio: v.aspect_ratio || '16:9',
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// useRoutes — fetches all route nodes for a workspace + full CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export function useRoutes(workspaceId) {
    const key = workspaceId ? `/api/routes?workspace_id=${workspaceId}` : null

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    })

    const nodes = Array.isArray(data?.routes) ? data.routes.map(dbToNode) : []

    // ── Create a new route node ─────────────────────────────────────────────────
    async function createNode({ videoId, title, color, x, y, isRoot = false }) {
        const res = await fetch('/api/routes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workspace_id: workspaceId,
                video_id: videoId || null,
                title,
                color: color || '#4F6EF7',
                x: Math.round(x ?? 300),
                y: Math.round(y ?? 180),
                is_root: isRoot,
            }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to create node')
        await mutate()
        return dbToNode(json.route)
    }

    // ── Update a route node (x/y, is_root, choice_points, etc.) ─────────────────
    async function updateNode(id, patch) {
        // Map camelCase → snake_case for the API
        const body = {}
        if ('title' in patch) body.title = patch.title
        if ('color' in patch) body.color = patch.color
        if ('videoId' in patch) body.video_id = patch.videoId
        if ('x' in patch) body.x = Math.round(patch.x)
        if ('y' in patch) body.y = Math.round(patch.y)
        if ('duration' in patch) body.duration = patch.duration
        if ('isRoot' in patch) body.is_root = patch.isRoot
        if ('choicePoints' in patch) body.choice_points = patch.choicePoints
        if ('ctaPoints' in patch) body.cta_points = patch.ctaPoints
        if ('landingPage' in patch) body.landing_page = patch.landingPage

        const res = await fetch(`/api/routes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to update node')
        // Optimistic update — revalidate in background
        await mutate()
        return dbToNode(json.route)
    }

    // ── Delete a route node ─────────────────────────────────────────────────────
    async function deleteNode(id) {
        const res = await fetch(`/api/routes/${id}`, { method: 'DELETE' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to delete node')
        await mutate()
        return true
    }

    // ── Set root node (unsets all others client-side, sets this one) ─────────────
    async function setRootNode(id) {
        // Unset all other roots first
        const others = nodes.filter((n) => n.isRoot && n.id !== id)
        await Promise.all(others.map((n) => updateNode(n.id, { isRoot: false })))
        return updateNode(id, { isRoot: true })
    }

    // ── Debounced position save (call after drag end) ─────────────────────────
    async function savePosition(id, x, y) {
        return updateNode(id, { x, y })
    }

    return {
        nodes,
        isLoading,
        isError: !!error,
        mutate,
        createNode,
        updateNode,
        deleteNode,
        setRootNode,
        savePosition,
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// useWorkspaceVideos — fetches the video library for the Builder palette
// ═══════════════════════════════════════════════════════════════════════════════
export function useWorkspaceVideos() {
    const { data, error, isLoading } = useSWR(
        '/api/videos?status=ready',
        fetcher,
        { revalidateOnFocus: false }
    )

    const videos = Array.isArray(data) ? data.map(dbToVideo) : []

    return { videos, isLoading, isError: !!error }
}