import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET /api/elements?video_id=xxx[&route_id=yyy]
export async function GET(request) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

    const { searchParams } = new URL(request.url)
    const video_id = searchParams.get('video_id')
    const route_id = searchParams.get('route_id')

    if (!video_id) return NextResponse.json({ error: 'video_id required' }, { status: 400 })

    // ✅ FIX 1: Build query before conditionally adding route_id filter
    let query = supabase
        .from('elements')
        .select('*')
        .eq('video_id', video_id)
        .order('sort_order', { ascending: true })

    if (route_id) {
        query = query.eq('route_id', route_id)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // ✅ FIX 2: Return plain array — matches what openEditor() and player_route_api expect
    return NextResponse.json(data || [])
}

// POST /api/elements — bulk replace all elements for a video
// Body: { video_id: string, elements: ElementShape[] }
export async function POST(request) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user, supabase } = auth

    let body
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { video_id, elements = [] } = body
    if (!video_id) return NextResponse.json({ error: 'video_id required' }, { status: 400 })

    // Verify the video belongs to this user's workspace
    const { data: video, error: vidErr } = await supabase
        .from('videos')
        .select('id, workspace_id')
        .eq('id', video_id)
        .single()

    if (vidErr || !video) {
        return NextResponse.json({ error: 'Video not found or access denied' }, { status: 404 })
    }

    // ── Delete all existing elements, then re-insert ──────────────────────────
    // NOTE: This is a full replace. Use PATCH /api/elements/:id or
    // POST /api/videos/:id/elements/bulk for non-destructive partial updates.
    const { error: delErr } = await supabase
        .from('elements')
        .delete()
        .eq('video_id', video_id)

    if (delErr) {
        console.error('[elements POST] delete error:', delErr)
        return NextResponse.json({ error: delErr.message }, { status: 500 })
    }

    if (elements.length === 0) {
        return NextResponse.json({ elements: [] })
    }

    // ✅ FIX 3: Map frontend shape → DB shape correctly
    // xPct/yPct/wPct/hPct are the canvas editor fields; x/y/w/h are the DB fields.
    const rows = elements.map((el, i) => ({
        // Skip temp client-side IDs — let DB generate a real UUID
        ...(el.id && !el.id.startsWith('bel-') && !el.id.startsWith('tmp_') ? { id: el.id } : {}),
        video_id,
        workspace_id: video.workspace_id,
        type: el.type,
        props: el.props || {},
        // Accept both naming conventions from the builder
        x: el.xPct ?? el.x ?? 10,
        y: el.yPct ?? el.y ?? 10,
        w: el.wPct ?? el.w ?? 40,
        h: el.hPct ?? el.h ?? 25,
        z_index: el.zIndex ?? el.z_index ?? 1,
        opacity: el.opacity ?? 1,
        timing: el.timing || {},
        gate: el.gate || { enabled: false },
        conditions: el.conditions || [],
        sort_order: i,
    }))

    const { data, error: insErr } = await supabase
        .from('elements')
        .insert(rows)
        .select()

    if (insErr) {
        console.error('[elements POST] insert error:', insErr)
        return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    return NextResponse.json({ elements: data }, { status: 201 })
}