import { NextResponse } from 'next/server'
import { requireAuth, getWorkspace } from '@/lib/auth'

// ── GET /api/routes?workspace_id=xxx ─────────────────────────────────────────
// Also supports auth-based lookup (no workspace_id param needed)
export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const wsParam = searchParams.get('workspace_id')

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user, supabase } = auth

    // Resolve workspace
    let workspace_id = wsParam
    if (!workspace_id) {
        const ws = await getWorkspace(supabase, user.id)
        if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
        workspace_id = ws.id
    }

    const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('[routes GET]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ routes: data })
}

// ── POST /api/routes ─────────────────────────────────────────────────────────
export async function POST(req) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user, supabase } = auth

    const workspace = await getWorkspace(supabase, user.id)
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    let body
    try { body = await req.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
        video_id,
        title,
        is_root = false,
        x = 300,
        y = 180,
        color = '#4F6EF7',
        duration,
        route_group,
        landing_page,
    } = body

    if (!title) {
        return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    // Generate a short readable ID that matches the TEXT primary key
    const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    const { data, error } = await supabase
        .from('routes')
        .insert({
            id,
            workspace_id: workspace.id,
            video_id: video_id || null,
            title,
            is_root,
            x: Math.round(x),
            y: Math.round(y),
            color,
            duration: duration || null,
            route_group,
            choice_points: [],
            cta_points: [],
            route_group: route_group || 'default',
            landing_page: landing_page || {},
        })
        .select()
        .single()

    if (error) {
        console.error('[routes POST]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ route: data }, { status: 201 })
}