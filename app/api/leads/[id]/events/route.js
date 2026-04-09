import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export async function POST(req, { params }) {
    try {
        const { id } = params
        const body = await req.json()
        const { event, payload = {} } = body

        if (!id || !event) {
            return NextResponse.json(
                { error: 'lead id and event are required' },
                { status: 400 }
            )
        }

        // Fetch existing responses
        const { data: lead, error: fetchError } = await supabase
            .from('leads')
            .select('responses')
            .eq('id', id)
            .single()

        if (fetchError || !lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        // Append event to responses JSONB
        const existing = lead.responses || {}
        const events = existing.events || []
        events.push({ event, payload, ts: new Date().toISOString() })

        const { error: updateError } = await supabase
            .from('leads')
            .update({
                responses: { ...existing, events },
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (err) {
        console.error('[lead-events] error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}