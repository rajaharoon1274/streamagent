import crypto from 'crypto'

/**
 * Push a lead to Mailchimp as a subscriber.
 * PUT upserts by email MD5 hash — safe to call multiple times.
 */
export async function pushLeadToMailchimp({ accessToken, metadata, lead }) {
    const dc = metadata?.dc || 'us1'
    const apiEndpoint = metadata?.api_endpoint || `https://${dc}.api.mailchimp.com`
    let listId = metadata?.list_id

    // Auto-pick first audience if none configured
    if (!listId) {
        const audienceRes = await fetch(`${apiEndpoint}/3.0/lists?count=1`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!audienceRes.ok) throw new Error('Mailchimp: could not fetch audiences')
        const audienceData = await audienceRes.json()
        listId = audienceData.lists?.[0]?.id
        if (!listId) throw new Error('Mailchimp: no audiences found in this account')
    }

    const emailHash = crypto.createHash('md5').update(lead.email.toLowerCase()).digest('hex')

    const body = {
        email_address: lead.email,
        status_if_new: 'subscribed',
        status: 'subscribed',
        merge_fields: {
            FNAME: lead.first_name || lead.name?.split(' ')[0] || '',
            LNAME: lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
            PHONE: lead.phone || '',
        },
        tags: ['StreamAgent Lead'],
    }

    const res = await fetch(`${apiEndpoint}/3.0/lists/${listId}/members/${emailHash}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Mailchimp push failed (${res.status}): ${err}`)
    }

    return res.json()
}