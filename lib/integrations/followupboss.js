/**
 * Push a lead to Follow Up Boss via the Events API.
 * Basic Auth: Base64(api_key + ':')
 */
export async function pushLeadToFollowUpBoss({ apiKey, lead }) {
    const encoded = Buffer.from(`${apiKey}:`).toString('base64')

    const body = {
        source: 'StreamAgent',
        system: 'StreamAgent',
        type: 'Registration',
        description: `StreamAgent lead — watch depth: ${lead.watch_depth_pct ?? 0}%`,
        people: [
            {
                firstName: lead.first_name || lead.name?.split(' ')[0] || '',
                lastName: lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
                emails: [{ value: lead.email }],
                phones: lead.phone ? [{ value: lead.phone }] : [],
            },
        ],
    }

    const res = await fetch('https://api.followupboss.com/v1/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${encoded}`,
            'X-System': 'StreamAgent',
            'X-System-Key': apiKey,
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`FollowUpBoss push failed (${res.status}): ${err}`)
    }

    return res.json()
}