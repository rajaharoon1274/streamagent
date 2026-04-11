// app/api/player/[video_id]/route.js
// ─────────────────────────��───────────────────────────────────────────────────
// PUBLIC endpoint — NO JWT required.
// Returns everything the player needs to render: video meta, elements, branding.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export async function GET(req, { params }) {
    const { video_id } = params

    if (!video_id) {
        return NextResponse.json({ error: 'Missing video_id' }, { status: 400 })
    }

    // ── 1. Fetch video (must be published or password-protected) ─────────────
    const { data: video, error: videoErr } = await supabase
        .from('videos')
        .select(`
      id,
      stream_uid,
      title,
      duration_seconds,
      aspect_ratio,
      thumbnail_url,
      privacy,
      password,
      password_headline,
      password_hint,
      branding,
      landing_page,
      comments_enabled,
      color,
      workspace_id
    `)
        .eq('id', video_id)
        .in('privacy', ['published', 'password'])
        .single()

    if (videoErr || !video) {
        return NextResponse.json(
            { error: 'Video not found or not published' },
            { status: 404 },
        )
    }

    // ── 2. Fetch workspace bandwidth flag ────────────────────────────────────
    const { data: workspace } = await supabase
        .from('workspaces')
        .select('bandwidth_gated, bandwidth_degraded, plan_tier')
        .eq('id', video.workspace_id)
        .single()

    // ── 3. Fetch all elements for this video ─────────────────────────────────
    const { data: elements, error: elErr } = await supabase
        .from('elements')
        .select(`
      id,
      type,
      x, y, w, h,
      z_index,
      opacity,
      props,
      timing,
      conditions,
      gate,
      lead_routing,
      sort_order
    `)
        .eq('video_id', video_id)
        .order('sort_order', { ascending: true })

    if (elErr) {
        console.error('[player API] elements fetch error:', elErr.message)
    }

    // ── 4. Remap DB column names → frontend shape ─────────────────────────────
    // overlay_renderer.jsx uses x/y/w/h/z_index (DB names)
    // WatchClient / ElementCanvas use xPct/yPct/wPct/hPct/zIndex (frontend names)
    // Expose both so every consumer works without further mapping
    const mappedElements = (elements || []).map(el => ({
        id: el.id,
        type: el.type,
        props: el.props || {},
        x: el.x ?? 10,
        y: el.y ?? 10,
        w: el.w ?? 40,
        h: el.h ?? 25,
        xPct: el.x ?? 10,
        yPct: el.y ?? 10,
        wPct: el.w ?? 40,
        hPct: el.h ?? 25,
        z_index: el.z_index ?? 1,
        zIndex: el.z_index ?? 1,
        opacity: el.opacity ?? 1,
        timing: el.timing || { mode: 'at-time', in: 0, duration: 5, animIn: 'fadeIn', animOut: 'fadeOut', animSpeed: '0.4', trigger: 'time' },
        gate: el.gate || { enabled: false },
        conditions: el.conditions || [],
        sort_order: el.sort_order,
    }))

    // ── 5. Strip sensitive data before returning ─────────────────────────────
    const { password: _pw, workspace_id: _wsId, ...safeVideo } = video

    return NextResponse.json(
        {
            video: {
                ...safeVideo,
                requires_password: video.privacy === 'password',
            },
            elements: mappedElements,
            workspace: {
                id: video.workspace_id,
                bandwidth_gated: workspace?.bandwidth_gated ?? false,
                bandwidth_degraded: workspace?.bandwidth_degraded ?? false,
                plan_tier: workspace?.plan_tier ?? 'core',
            },
        },
        {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=10',
                'Access-Control-Allow-Origin': '*',
            },
        },
    )
}

// Allow iframe embeds cross-origin
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}