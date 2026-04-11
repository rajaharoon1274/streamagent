import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, getWorkspace } from '@/lib/auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

/* ─── GET /api/leads/:id ─────────────────────────────────────────────────── */
export async function GET(req, { params }) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        const workspace = await getWorkspace(supabase, user.id)
        if (!workspace) {
            return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
        }

        const { id } = params

        // Fetch the lead with video info
        const { data: lead, error } = await supabaseAdmin
            .from('leads')
            .select(`
        *,
        videos:video_id ( id, title, thumbnail_url, duration_seconds )
      `)
            .eq('id', id)
            .eq('workspace_id', workspace.id)
            .single()

        if (error || !lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        // Fetch lead events (timeline / interaction history)
        const { data: events } = await supabaseAdmin
            .from('lead_events')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false })
            .limit(100)

        return NextResponse.json({ ...lead, events: events || [] })
    } catch (err) {
        console.error('[leads/:id GET] error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/* ─── PATCH /api/leads/:id ───────────────────────────────────────────────── */
export async function PATCH(req, { params }) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        const workspace = await getWorkspace(supabase, user.id)
        if (!workspace) {
            return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
        }

        const { id } = params
        const body = await req.json()

        // Only allow updating these fields
        const allowedFields = [
            'status', 'notes', 'tags', 'follow_up_date',
            'score', 'name', 'first_name', 'last_name',
            'email', 'phone',
        ]
        const updates = {}
        for (const key of allowedFields) {
            if (body[key] !== undefined) updates[key] = body[key]
        }

        // Validate status if provided
        if (updates.status) {
            const validStatuses = ['New', 'Contacted', 'Qualified', 'Closed']
            if (!validStatuses.includes(updates.status)) {
                return NextResponse.json(
                    { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                    { status: 400 }
                )
            }
        }

        updates.updated_at = new Date().toISOString()

        const { data, error } = await supabaseAdmin
            .from('leads')
            .update(updates)
            .eq('id', id)
            .eq('workspace_id', workspace.id)
            .select()
            .single()

        if (error || !data) {
            console.error('[leads/:id PATCH] error:', error)
            return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
        }

        // Log status change as a lead event
        if (body.status) {
            await supabaseAdmin.from('lead_events').insert({
                lead_id: id,
                video_id: data.video_id,
                event_type: 'status_change',
                metadata: { from: body._previous_status || null, to: body.status },
            })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('[leads/:id PATCH] unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/* ─── DELETE /api/leads/:id ──────────────────────────────────────────────── */
export async function DELETE(req, { params }) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        const workspace = await getWorkspace(supabase, user.id)
        if (!workspace) {
            return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
        }

        const { id } = params

        const { error } = await supabaseAdmin
            .from('leads')
            .delete()
            .eq('id', id)
            .eq('workspace_id', workspace.id)

        if (error) {
            console.error('[leads/:id DELETE] error:', error)
            return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[leads/:id DELETE] unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}