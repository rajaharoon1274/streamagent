import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

/**
 * GET /api/routes/resolve
 * ?workspace_id=xxx&element_id=yyy&choice_value=zzz
 *
 * Returns the target_video_id for a given choice selection.
 * If no matching edge → returns { target_video_id: null } → resume current video
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const workspace_id = searchParams.get('workspace_id')
    const element_id = searchParams.get('element_id')
    const choice_value = searchParams.get('choice_value')

    if (!workspace_id || !element_id) {
        return NextResponse.json({ error: 'workspace_id and element_id required' }, { status: 400 })
    }

    // Find matching edge for this element + choice
    const { data: edge, error } = await supabase
        .from('route_edges')
        .select(`
            id,
            target_route_id,
            choice_value
        `)
        .eq('workspace_id', workspace_id)
        .eq('element_id', element_id)
        .eq('choice_value', choice_value || '')
        .maybeSingle()

    if (error) {
        console.error('[routes/resolve]', error)
        return NextResponse.json({ target_video_id: null })
    }

    if (!edge) {
        // No matching edge → resume current video
        return NextResponse.json({ target_video_id: null })
    }

    // Get the target route's video_id
    const { data: targetRoute } = await supabase
        .from('routes')
        .select('video_id, title')
        .eq('id', edge.target_route_id)
        .single()

    return NextResponse.json({
        target_video_id: targetRoute?.video_id || null,
        target_route_id: edge.target_route_id,
        target_title: targetRoute?.title || null,
    })
}