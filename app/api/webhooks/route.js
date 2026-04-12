import { NextResponse } from 'next/server'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const supabase = createAdminClient()
    const workspace = await getWorkspace(supabase, user.id)
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('id, name, url, events, active, created_at')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ webhooks: data || [] })
}

export async function POST(request) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    let body = {}
    try { body = await request.json() } catch { }
    const { name, url, events } = body

    if (!name || !url) return NextResponse.json({ error: 'name and url are required' }, { status: 400 })
    try { new URL(url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }

    const supabase = createAdminClient()
    const workspace = await getWorkspace(supabase, user.id)
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    // Generate HMAC signing secret
    const secret = [...crypto.getRandomValues(new Uint8Array(32))]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

    const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert({
            workspace_id: workspace.id,
            name,
            url,
            events: events || ['lead.created'],
            active: true,
            secret,
        })
        .select('id, name, url, events, active, created_at')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ webhook: data }, { status: 201 })
}