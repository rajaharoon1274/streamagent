import { NextResponse } from 'next/server'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

const PROVIDER_META = {
    hubspot: { name: 'HubSpot', auth_type: 'oauth', category: 'crm' },
    mailchimp: { name: 'Mailchimp', auth_type: 'oauth', category: 'email' },
    ghl: { name: 'GoHighLevel', auth_type: 'oauth', category: 'crm' },
    activecampaign: { name: 'ActiveCampaign', auth_type: 'api_key', category: 'email' },
    followupboss: { name: 'Follow Up Boss', auth_type: 'api_key', category: 'crm' },
    slack: { name: 'Slack', auth_type: 'oauth', category: 'notifications' },
}

export async function GET() {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const supabase = createAdminClient()
    const workspace = await getWorkspace(supabase, user.id)
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { data: tokens } = await supabase
        .from('integration_tokens')
        .select('provider, auth_type, connected, metadata, expires_at, scopes, created_at')
        .eq('workspace_id', workspace.id)

    const { data: webhooks } = await supabase
        .from('webhook_endpoints')
        .select('id, name, url, events, active, created_at')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: true })

    const tokenMap = {}
    for (const t of (tokens || [])) tokenMap[t.provider] = t

    const integrations = Object.entries(PROVIDER_META).map(([key, meta]) => ({
        provider: key,
        ...meta,
        connected: tokenMap[key]?.connected ?? false,
        account: tokenMap[key]?.metadata?.account ?? null,
        scopes: tokenMap[key]?.scopes ?? null,
        expires_at: tokenMap[key]?.expires_at ?? null,
    }))

    return NextResponse.json({ integrations, webhooks: webhooks || [] })
}