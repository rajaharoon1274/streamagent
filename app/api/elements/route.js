import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET /api/elements?video_id=xxx
export async function GET(request) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

    const { searchParams } = new URL(request.url)
    const video_id = searchParams.get('video_id')
    if (!video_id) return NextResponse.json({ error: 'video_id required' }, { status: 400 })

    const { data, error } = await supabase
        .from('elements')
        .select('*')
        .eq('video_id', video_id)
        .order('sort_order', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// POST /api/elements — bulk replace all elements for a video
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

    // Delete all existing elements for this video, then re-insert
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

    // Map frontend shape → DB shape
    const rows = elements.map((el, i) => ({
        // Use existing real IDs (not temp "bel-" prefixed ones without UUIDs) or let DB generate
        id: el.id?.startsWith('bel-') ? undefined : el.id,
        video_id,
        workspace_id: video.workspace_id,
        type: el.type,
        props: el.props || {},
        x: el.xPct ?? 10,
        y: el.yPct ?? 10,
        w: el.wPct ?? 40,
        h: el.hPct ?? 25,
        z_index: el.zIndex ?? 1,
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