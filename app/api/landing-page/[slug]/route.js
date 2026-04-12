// PUBLIC — no auth required
// Resolves a slug → video + workspace pixel config

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export async function GET(_req, { params }) {
    const { slug } = params

    if (!slug) {
        return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    }

    // 1. Resolve slug → video_id from landing_pages table
    const { data: lpRow, error: slugErr } = await supabase
        .from('landing_pages')
        .select('video_id, status')
        .eq('slug', slug)
        .maybeSingle()

    if (slugErr || !lpRow || !lpRow.video_id) {
        return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
    }

    // 2. Fetch the video — must be published
    const { data: video, error: videoErr } = await supabase
        .from('videos')
        .select(`
      id, stream_uid, title, duration_seconds, aspect_ratio,
      thumbnail_url, privacy, branding, landing_page, color, workspace_id
    `)
        .eq('id', lpRow.video_id)
        .eq('privacy', 'published')
        .single()

    if (videoErr || !video) {
        return NextResponse.json(
            { error: 'Video not found or not published' },
            { status: 404 },
        )
    }

    // 3. Fetch workspace pixel IDs (service_role bypasses RLS)
    const { data: workspace } = await supabase
        .from('workspaces')
        .select(`
      meta_pixel_id, tiktok_pixel_id, google_ads_id,
      linkedin_partner_id, cv_lead,
      bandwidth_gated, bandwidth_degraded, plan_tier
    `)
        .eq('id', video.workspace_id)
        .single()

    return NextResponse.json(
        {
            video,
            slug,
            workspace: {
                meta_pixel_id: workspace?.meta_pixel_id ?? null,
                tiktok_pixel_id: workspace?.tiktok_pixel_id ?? null,
                google_ads_id: workspace?.google_ads_id ?? null,
                linkedin_partner_id: workspace?.linkedin_partner_id ?? null,
                cv_lead: workspace?.cv_lead ?? 20,
                bandwidth_gated: workspace?.bandwidth_gated ?? false,
                bandwidth_degraded: workspace?.bandwidth_degraded ?? false,
                plan_tier: workspace?.plan_tier ?? 'core',
            },
        },
        {
            status: 200,
            headers: { 'Cache-Control': 'no-store' },
        },
    )
}