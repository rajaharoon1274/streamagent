import { NextResponse } from 'next/server'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(request, { params }) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const supabase = createAdminClient()
    const workspace = await getWorkspace(supabase, user.id)
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    let body = {}
    try { body = await request.json() } catch { }

    const allowed = {}
    if (body.name !== undefined) allowed.name = body.name
    if (body.events !== undefined) allowed.events = body.events
    if (body.active !== undefined) allowed.active = body.active
    if (body.url !== undefined) {
        try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
        allowed.url = body.url
    }

    const { data, error } = await supabase
        .from('webhook_endpoints')
        .update(allowed)
        .eq('id', params.id)
        .eq('workspace_id', workspace.id)
        .select('id, name, url, events, active')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    return NextResponse.json({ webhook: data })
}

export async function DELETE(request, { params }) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const supabase = createAdminClient()
    const workspace = await getWorkspace(supabase, user.id)
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { error } = await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('id', params.id)
        .eq('workspace_id', workspace.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}