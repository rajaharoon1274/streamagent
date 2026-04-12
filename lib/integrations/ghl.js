/**
 * Push a lead to GoHighLevel (GHL) as a Contact.
 * Uses the GHL REST API v2021-07-28.
 */
export async function pushLeadToGHL({ accessToken, metadata, lead }) {
    const locationId = metadata?.locationId || metadata?.account

    const body = {
        firstName: lead.first_name || lead.name?.split(' ')[0] || '',
        lastName: lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
        email: lead.email,
        phone: lead.phone || '',
        source: 'StreamAgent',
        tags: ['StreamAgent Lead'],
    }

    const url = locationId
        ? `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}`
        : 'https://services.leadconnectorhq.com/contacts/'

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Version': '2021-07-28',
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`GHL push failed (${res.status}): ${err}`)
    }

    return res.json()
}