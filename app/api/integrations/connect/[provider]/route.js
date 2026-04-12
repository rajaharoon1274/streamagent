import { NextResponse } from 'next/server'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

const OAUTH_CONFIG = {
    hubspot: {
        auth_url: 'https://app.hubspot.com/oauth/authorize',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        scope: 'crm.objects.contacts.write crm.objects.contacts.read',
    },
    mailchimp: {
        auth_url: 'https://login.mailchimp.com/oauth2/authorize',
        client_id: process.env.MAILCHIMP_CLIENT_ID,
        scope: '',
    },
    ghl: {
        auth_url: 'https://marketplace.gohighlevel.com/oauth/chooselocation',
        client_id: process.env.GHL_CLIENT_ID,
        scope: 'contacts.write contacts.read',
    },
    slack: {
        auth_url: 'https://slack.com/oauth/v2/authorize',
        client_id: process.env.SLACK_CLIENT_ID,
        scope: 'incoming-webhook',
    },
}

const API_KEY_PROVIDERS = ['followupboss', 'activecampaign']

export async function POST(request, { params }) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const provider = params.provider
    if (!provider) return NextResponse.json({ error: 'Provider required' }, { status: 400 })

    const supabase = createAdminClient()
    const workspace = await getWorkspace(supabase, user.id)
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    // ── API-key providers (FollowUpBoss, ActiveCampaign) ──────────────
    if (API_KEY_PROVIDERS.includes(provider)) {
        let body = {}
        try { body = await request.json() } catch { }
        const { api_key, api_url } = body

        if (!api_key) return NextResponse.json({ error: 'api_key is required' }, { status: 400 })

        const metadata = {}
        if (api_url) metadata.api_url = api_url

        const { error } = await supabase
            .from('integration_tokens')
            .upsert({
                workspace_id: workspace.id,
                provider,
                auth_type: 'api_key',
                api_key,
                connected: true,
                metadata,
            }, { onConflict: 'workspace_id,provider' })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, provider })
    }

    // ── OAuth providers ─────────��─────────────────────────────────────
    const config = OAUTH_CONFIG[provider]
    if (!config) {
        return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
    }
    if (!config.client_id) {
        return NextResponse.json(
            { error: `${provider} OAuth not configured — add ${provider.toUpperCase()}_CLIENT_ID to env` },
            { status: 500 }
        )
    }

    // Generate and persist CSRF state
    const state = `${workspace.id}__${provider}__${crypto.randomUUID()}`

    await supabase
        .from('integration_tokens')
        .upsert({
            workspace_id: workspace.id,
            provider,
            auth_type: 'oauth',
            connected: false,
            metadata: { oauth_state: state },
        }, { onConflict: 'workspace_id,provider' })

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback`
    const url = new URL(config.auth_url)
    url.searchParams.set('client_id', config.client_id)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', state)
    if (config.scope) url.searchParams.set('scope', config.scope)

    return NextResponse.json({ redirect_url: url.toString() })
}