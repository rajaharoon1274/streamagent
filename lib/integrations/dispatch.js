import { pushLeadToHubSpot } from './hubspot.js'
import { pushLeadToMailchimp } from './mailchimp.js'
import { pushLeadToGHL } from './ghl.js'
import { pushLeadToFollowUpBoss } from './followupboss.js'
import { pushLeadToActiveCampaign } from './activecampaign.js'
import { dispatchWebhook } from './webhooks.js'
import https from 'node:https'

/**
 * Fire-and-forget — dispatch lead to all connected integrations + webhooks.
 * Never throws, never blocks the API response.
 */
export function dispatchLead(supabase, workspaceId, lead) {
    Promise.allSettled([
        _dispatchIntegrations(supabase, workspaceId, lead),
        _dispatchWebhooks(supabase, workspaceId, lead),
    ]).catch(() => { })
}

async function _dispatchIntegrations(supabase, workspaceId, lead) {
    const { data: tokens } = await supabase
        .from('integration_tokens')
        .select('provider, auth_type, access_token, metadata, connected')
        .eq('workspace_id', workspaceId)
        .eq('connected', true)

    await Promise.allSettled(
        (tokens || []).map(token =>
            _pushToProvider(token, lead).catch(err =>
                console.error(`[Dispatch] ${token.provider} failed:`, err.message)
            )
        )
    )
}

async function _dispatchWebhooks(supabase, workspaceId, lead) {
    const { data: webhooks } = await supabase
        .from('webhook_endpoints')
        .select('id, url, events, secret, active')
        .eq('workspace_id', workspaceId)
        .eq('active', true)

    await Promise.allSettled(
        (webhooks || [])
            .filter(wh => wh.events?.includes('lead.created') || wh.events?.includes('*'))
            .map(wh =>
                dispatchWebhook({ url: wh.url, secret: wh.secret, payload: lead, event: 'lead.created' })
                    .catch(err => console.error(`[Dispatch] Webhook ${wh.id} failed:`, err.message))
            )
    )
}

async function _pushToProvider(token, lead) {
    switch (token.provider) {
        case 'hubspot':
            return pushLeadToHubSpot({ accessToken: token.access_token, lead })

        case 'mailchimp':
            return pushLeadToMailchimp({ accessToken: token.access_token, metadata: token.metadata, lead })

        case 'ghl':
            return pushLeadToGHL({ accessToken: token.access_token, metadata: token.metadata, lead })

        case 'followupboss':
            return pushLeadToFollowUpBoss({ apiKey: token.access_token, lead })

        case 'activecampaign':
            return pushLeadToActiveCampaign({
                apiKey: token.access_token,
                apiUrl: token.metadata?.api_url,
                lead,
            })

        case 'slack':
            if (token.metadata?.incoming_webhook?.url) {
                return _slackNotify({ webhookUrl: token.metadata.incoming_webhook.url, lead })
            }
            break
    }
}

// Slack uses its own incoming webhook URL — also needs IPv4
function _slackNotify({ webhookUrl, lead }) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            text: '🎯 New StreamAgent lead captured!',
            blocks: [{
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: [
                        `*New Lead* 🎯`,
                        `*Email:* ${lead.email}`,
                        `*Name:* ${lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'N/A'}`,
                        `*Phone:* ${lead.phone || 'N/A'}`,
                        `*Watch Depth:* ${lead.watch_depth_pct ?? 0}%`,
                    ].join('\n'),
                },
            }],
        })

        const url = new URL(webhookUrl)
        const req = https.request(
            {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'POST',
                family: 4,
                timeout: 8000,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
            },
            (res) => {
                res.resume()
                res.on('end', () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        reject(new Error(`Slack failed: ${res.statusCode}`))
                    } else {
                        resolve()
                    }
                })
            }
        )
        req.on('timeout', () => { req.destroy(); reject(new Error('Slack timeout')) })
        req.on('error', reject)
        req.write(body)
        req.end()
    })
}