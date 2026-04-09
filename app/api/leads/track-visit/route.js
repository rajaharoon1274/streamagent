import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

/**
 * Track a return visit from a known viewer.
 * Called on player load when ?lid= or email cookie is present.
 * Records an element_interaction of type 'return_visit'.
 */
export async function POST(req) {
    try {
        const { workspace_id, video_id, lid, email, source_url } = await req.json()

        if (!workspace_id || !video_id) {
            return NextResponse.json({ ok: false }, { status: 400 })
        }

        // ── Resolve lead_id ───────────────────────────────────────────────────
        let leadId = null

        // Option A: lid token present — decode and look up
        if (lid) {
            // lid is just the lead UUID (you can hash it later for security)
            const { data: lead } = await supabase
                .from('leads')
                .select('id')
                .eq('id', lid)
                .eq('workspace_id', workspace_id)
                .single()
            if (lead) leadId = lead.id
        }

        // Option B: email cookie present — find existing lead by email
        if (!leadId && email) {
            const { data: lead } = await supabase
                .from('leads')
                .select('id')
                .eq('email', email.trim().toLowerCase())
                .eq('workspace_id', workspace_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
            if (lead) leadId = lead.id
        }

        if (!leadId) {
            // Unknown visitor — nothing to track
            return NextResponse.json({ ok: true, tracked: false })
        }

        // ── Record return visit as interaction ────────────────────────────────
        await supabase
            .from('element_interactions')
            .insert({
                workspace_id,
                video_id,
                element_id: null,
                interaction_type: 'return_visit',
                value: {
                    lead_id: leadId,
                    source_url: source_url || null,
                    via: lid ? 'lid_token' : 'email_cookie',
                },
                visitor_fingerprint: null,
            })

        // ── Update lead's last seen ───────────────────────────────────────────
        await supabase
            .from('leads')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', leadId)

        return NextResponse.json({ ok: true, tracked: true, lead_id: leadId })

    } catch (err) {
        console.error('[track-visit] error:', err)
        return NextResponse.json({ ok: false }, { status: 500 })
    }
}