// app/api/player/[video_id]/route.js
// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC endpoint — NO JWT required.
// Returns everything the player needs to render: video meta, elements, branding.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service-role so RLS public policies apply correctly
// (el_public & vid_public policies allow SELECT on published/password videos)
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

    // ── 4. Strip sensitive data before returning ─────────────────────────────
    // Never send the actual password — only a flag that one is required
    const { password: _pw, workspace_id: _wsId, ...safeVideo } = video

    return NextResponse.json(
        {
            video: {
                ...safeVideo,
                requires_password: video.privacy === 'password',
            },
            elements: elements || [],
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
                // Cache for 10 s at edge, revalidate in background
                'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
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