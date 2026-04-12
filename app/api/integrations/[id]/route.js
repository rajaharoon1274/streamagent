import { NextResponse } from 'next/server'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE(request, { params }) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const provider = params.id
    if (!provider) return NextResponse.json({ error: 'Provider required' }, { status: 400 })

    const supabase = createAdminClient()
    const workspace = await getWorkspace(supabase, user.id)
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { error } = await supabase
        .from('integration_tokens')
        .delete()
        .eq('workspace_id', workspace.id)
        .eq('provider', provider)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, provider })
}