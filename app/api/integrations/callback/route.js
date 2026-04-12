import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import dns from 'node:dns'

// ── Force IPv4 — Node.js fetch tries IPv6 first which times out on many
//    dev machines. This sets the default DNS result order to IPv4 first.
dns.setDefaultResultOrder('ipv4first')

const TOKEN_CONFIG = {
    hubspot: {
        token_url: 'https://api.hubapi.com/oauth/v1/token',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        getAccount: (d) => d.hub_domain || d.hub_id?.toString() || null,
    },
    mailchimp: {
        token_url: 'https://login.mailchimp.com/oauth2/token',
        client_id: process.env.MAILCHIMP_CLIENT_ID,
        client_secret: process.env.MAILCHIMP_CLIENT_SECRET,
        getAccount: () => null,
    },
    ghl: {
        token_url: 'https://services.leadconnectorhq.com/oauth/token',
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        getAccount: (d) => d.locationId || null,
    },
    slack: {
        token_url: 'https://slack.com/api/oauth.v2.access',
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        getAccount: (d) => d.team?.name || null,
    },
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const failRedirect = (msg) =>
        NextResponse.redirect(`${appUrl}/integrations?error=${encodeURIComponent(msg)}`)

    if (oauthError) return failRedirect(oauthError)
    if (!code || !state) return failRedirect('missing_params')

    // state = "workspaceId__provider__nonce"
    const parts = state.split('__')
    if (parts.length < 3) return failRedirect('invalid_state')

    const [workspaceId, provider] = parts

    if (!workspaceId || !provider) return failRedirect('invalid_state')

    const config = TOKEN_CONFIG[provider]
    if (!config) return failRedirect('unknown_provider')
    if (!config.client_id || !config.client_secret) {
        return failRedirect(`${provider}_not_configured`)
    }

    const supabase = createAdminClient()

    // ── Verify workspaceId is a real workspace ──
    const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('id', workspaceId)
        .single()

    if (wsError || !workspace) {
        return failRedirect('invalid_workspace')
    }

    // ── Exchange authorization code for tokens ──
    const redirectUri = `${appUrl}/api/integrations/callback`

    let tokenData
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        const res = await fetch(config.token_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: config.client_id,
                client_secret: config.client_secret,
            }).toString(),
            signal: controller.signal,
        })
        clearTimeout(timeoutId)

        tokenData = await res.json()
    } catch (err) {
        const reason = err.name === 'AbortError' ? 'timeout' : err.message
        console.error(`[OAuth] Token exchange failed for ${provider}:`, reason, err.cause || '')
        return failRedirect('token_exchange_failed')
    }

    if (tokenData.error) {
        console.error(`[OAuth] Provider error for ${provider}:`, tokenData)
        return failRedirect(tokenData.error)
    }

    // ── Fetch account label + extra metadata per provider ──
    let account = config.getAccount(tokenData) || null
    let metadata = {}

    try {
        if (provider === 'hubspot') {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)
            const meRes = await fetch(
                `https://api.hubapi.com/oauth/v1/access-tokens/${tokenData.access_token}`,
                { signal: controller.signal }
            )
            clearTimeout(timeoutId)
            const me = await meRes.json()
            account = me.user || me.hub_domain || account
            metadata = { hub_id: me.hub_id, hub_domain: me.hub_domain }

        } else if (provider === 'mailchimp') {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)
            const mcRes = await fetch('https://login.mailchimp.com/oauth2/metadata', {
                headers: { Authorization: `OAuth ${tokenData.access_token}` },
                signal: controller.signal,
            })
            clearTimeout(timeoutId)
            const mcData = await mcRes.json()
            account = mcData.login?.email || mcData.accountname || null
            metadata = {
                dc: mcData.dc,
                api_endpoint: mcData.api_endpoint,
                account: mcData.accountname,
            }

        } else if (provider === 'slack') {
            account = tokenData.team?.name || null
            metadata = {
                account,
                incoming_webhook: tokenData.incoming_webhook || null,
                team_id: tokenData.team?.id || null,
            }

        } else if (provider === 'ghl') {
            account = tokenData.locationId || null
            metadata = {
                location_id: tokenData.locationId || null,
                company_id: tokenData.companyId || null,
            }
        }
    } catch (e) {
        // Non-fatal — we still have the token, just no account label
        console.warn(`[OAuth] Could not fetch account info for ${provider}:`, e.message)
    }

    // ── Calculate token expiry ──
    const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null

    // ── Upsert token into DB ──
    const { error: upsertError } = await supabase
        .from('integration_tokens')
        .upsert(
            {
                workspace_id: workspaceId,
                provider,
                auth_type: 'oauth',
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token ?? null,
                expires_at: expiresAt,
                scopes: tokenData.scope ?? null,
                connected: true,
                account,
                metadata,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'workspace_id,provider' }
        )

    if (upsertError) {
        console.error('[OAuth] Token upsert failed:', upsertError)
        return failRedirect('db_error')
    }

    // ── Success ──
    return NextResponse.redirect(`${appUrl}/integrations?connected=${provider}`)
}