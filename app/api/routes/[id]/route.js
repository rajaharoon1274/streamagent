import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// ── PATCH /api/routes/:id ─────────────────────────────────────────────────────
export async function PATCH(req, { params }) {
    const { id } = params

    try {
        const body = await req.json()

        // Only allow safe fields to be updated
        const allowed = [
            'title', 'video_id', 'color', 'is_root',
            'x', 'y', 'duration',
            'choice_points', 'cta_points', 'landing_page',
        ]
        const updates = {}
        for (const key of allowed) {
            if (key in body) updates[key] = body[key]
        }
        updates.updated_at = new Date().toISOString()

        if (Object.keys(updates).length <= 1) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('routes')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('[routes PATCH]', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ route: data })

    } catch (err) {
        console.error('[routes PATCH] unexpected:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// ── DELETE /api/routes/:id ────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
    const { id } = params

    const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('[routes DELETE]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}