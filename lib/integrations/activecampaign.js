/**
 * Push a lead to ActiveCampaign via the /contact/sync endpoint.
 * Requires: api_url (your account URL) + api_key.
 */
export async function pushLeadToActiveCampaign({ apiKey, apiUrl, lead }) {
    if (!apiUrl) throw new Error('ActiveCampaign: api_url is required in metadata')

    const base = apiUrl.replace(/\/$/, '')

    const body = {
        contact: {
            email: lead.email,
            firstName: lead.first_name || lead.name?.split(' ')[0] || '',
            lastName: lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
            phone: lead.phone || '',
        },
    }

    const res = await fetch(`${base}/api/3/contact/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Api-Token': apiKey,
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`ActiveCampaign push failed (${res.status}): ${err}`)
    }

    return res.json()
}