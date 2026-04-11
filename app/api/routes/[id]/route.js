import { NextResponse } from 'next/server'
import { requireAuth, getWorkspace } from '@/lib/auth'

// ── PATCH /api/routes/:id ────────────────────────────────────────────────────
export async function PATCH(req, { params }) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user, supabase } = auth

    const workspace = await getWorkspace(supabase, user.id)
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    let body
    try { body = await req.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { id } = params

    // Only allow safe fields
    const ALLOWED = ['title', 'video_id', 'color', 'is_root', 'x', 'y', 'duration', 'choice_points', 'cta_points', 'landing_page', 'route_group']
    const updates = {}
    for (const key of ALLOWED) {
        if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Verify ownership
    const { data: existing, error: fetchErr } = await supabase
        .from('routes')
        .select('id, workspace_id')
        .eq('id', id)
        .eq('workspace_id', workspace.id)
        .single()

    if (fetchErr || !existing) {
        return NextResponse.json({ error: 'Route not found or access denied' }, { status: 404 })
    }

    const { data, error } = await supabase
        .from('routes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('[routes PATCH]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ route: data })
}

// ── DELETE /api/routes/:id ───────────────────────────────────────────────────
export async function DELETE(req, { params }) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user, supabase } = auth

    const workspace = await getWorkspace(supabase, user.id)
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { id } = params

    // Verify ownership before delete
    const { data: existing, error: fetchErr } = await supabase
        .from('routes')
        .select('id')
        .eq('id', id)
        .eq('workspace_id', workspace.id)
        .single()

    if (fetchErr || !existing) {
        return NextResponse.json({ error: 'Route not found or access denied' }, { status: 404 })
    }

    const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('[routes DELETE]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}