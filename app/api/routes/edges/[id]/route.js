import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// ── DELETE /api/routes/edges/:id ──────────────────────────────────────────────
export async function DELETE(req, { params }) {
    const { id } = params

    const { error } = await supabase
        .from('route_edges')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('[route_edges DELETE]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}