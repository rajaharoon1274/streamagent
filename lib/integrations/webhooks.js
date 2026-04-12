import https from 'node:https'
import http from 'node:http'
import crypto from 'node:crypto'

/**
 * POST lead payload to a webhook endpoint.
 * Signs the payload with HMAC-SHA256 if a secret is provided.
 */
export async function dispatchWebhook({ url, secret, payload, event = 'lead.created' }) {
    const body = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
    })

    const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'StreamAgent-Webhook/1.0',
    }

    if (secret) {
        const sig = crypto.createHmac('sha256', secret).update(body).digest('hex')
        headers['X-StreamAgent-Signature'] = `sha256=${sig}`
    }

    return new Promise((resolve, reject) => {
        const parsed = new URL(url)
        const lib = parsed.protocol === 'https:' ? https : http

        const req = lib.request(
            {
                hostname: parsed.hostname,
                path: parsed.pathname + parsed.search,
                method: 'POST',
                family: 4,
                timeout: 10000,
                headers,
            },
            (res) => {
                let raw = ''
                res.on('data', (c) => { raw += c })
                res.on('end', () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        reject(new Error(`Webhook ${url} responded ${res.statusCode}`))
                    } else {
                        resolve({ status: res.statusCode })
                    }
                })
            }
        )

        req.on('timeout', () => { req.destroy(); reject(new Error(`Webhook timeout: ${url}`)) })
        req.on('error', reject)
        req.write(body)
        req.end()
    })
}