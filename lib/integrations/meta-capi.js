import https from 'node:https'
import crypto from 'node:crypto'

/**
 * Server-side Meta Conversions API (CAPI)
 * Enterprise-only. Sends Lead event to Meta after lead capture.
 */

function sha256(value) {
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function httpsPost(urlStr, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr)
        const data = JSON.stringify(body)

        const req = https.request(
            {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'POST',
                family: 4,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                },
            },
            (res) => {
                let raw = ''
                res.on('data', (c) => { raw += c })
                res.on('end', () => {
                    try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) }
                    catch { resolve({ status: res.statusCode, body: raw }) }
                })
            }
        )
        req.on('timeout', () => { req.destroy(); reject(new Error('CAPI timeout')) })
        req.on('error', reject)
        req.write(data)
        req.end()
    })
}

/**
 * Send Lead event to Meta CAPI
 * Only called for Enterprise workspaces with meta_capi_dataset_id + meta_capi_token
 */
export async function sendMetaCAPILead({ workspace, lead, sourceUrl }) {
    const { meta_capi_dataset_id, meta_capi_token, plan_tier } = workspace

    // Enterprise-only gate
    if (plan_tier !== 'enterprise') return
    if (!meta_capi_dataset_id || !meta_capi_token) return

    const eventTime = Math.floor(Date.now() / 1000)
    const eventId = `lead_${lead.id}`

    const userData = {}
    if (lead.email) userData.em = [sha256(lead.email)]
    if (lead.phone) userData.ph = [sha256(lead.phone.replace(/\D/g, ''))]
    if (lead.first_name) userData.fn = [sha256(lead.first_name)]
    if (lead.last_name) userData.ln = [sha256(lead.last_name)]
    if (lead.ip_address) userData.client_ip_address = lead.ip_address

    const payload = {
        data: [
            {
                event_name: 'Lead',
                event_time: eventTime,
                event_id: eventId,
                event_source_url: sourceUrl || '',
                action_source: 'website',
                user_data: userData,
                custom_data: {
                    lead_id: lead.id,
                    video_id: lead.video_id,
                    watch_depth_pct: lead.watch_depth_pct,
                    value: workspace.cv_lead || 20,
                    currency: 'USD',
                },
            },
        ],
    }

    try {
        const url = `https://graph.facebook.com/v19.0/${meta_capi_dataset_id}/events?access_token=${meta_capi_token}`
        const { status, body } = await httpsPost(url, payload)

        if (status < 200 || status >= 300) {
            console.error('[Meta CAPI] Failed:', status, body)
        } else {
            console.log(`[Meta CAPI] Lead event sent: ${lead.email}, events_received: ${body.events_received}`)
        }
    } catch (err) {
        // Non-fatal — never block lead capture
        console.error('[Meta CAPI] Error (non-fatal):', err.message)
    }
}