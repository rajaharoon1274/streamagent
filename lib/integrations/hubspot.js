import https from 'node:https'

/**
 * Make an HTTPS request using native Node.js (family: 4 = IPv4 only)
 */
function request(method, urlStr, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr)
        const data = body ? JSON.stringify(body) : null

        const req = https.request(
            {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method,
                family: 4,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
                    ...headers,
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

        req.on('timeout', () => { req.destroy(); reject(new Error('HubSpot request timeout')) })
        req.on('error', reject)
        if (data) req.write(data)
        req.end()
    })
}

/**
 * Push a lead to HubSpot as a Contact (upsert by email).
 */
export async function pushLeadToHubSpot({ accessToken, lead }) {
    const properties = {
        email: lead.email,
        firstname: lead.first_name || lead.name?.split(' ')[0] || '',
        lastname: lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
        phone: lead.phone || '',
    }

    const authHeader = { Authorization: `Bearer ${accessToken}` }

    const { status, body } = await request(
        'POST',
        'https://api.hubapi.com/crm/v3/objects/contacts',
        { properties },
        authHeader
    )

    // 409 = contact already exists — patch instead
    if (status === 409) {
        const existingId = body?.message?.match(/ID:\s*(\d+)/)?.[1]
        if (existingId) {
            await request(
                'PATCH',
                `https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`,
                { properties },
                authHeader
            )
        }
        return { updated: true }
    }

    if (status < 200 || status >= 300) {
        throw new Error(`HubSpot push failed (${status}): ${JSON.stringify(body)}`)
    }

    console.log(`[HubSpot] Contact created/updated: ${lead.email}`)
    return body
}