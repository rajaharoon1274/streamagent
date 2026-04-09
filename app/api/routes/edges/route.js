import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// ── POST /api/routes/edges ────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const body = await req.json()
        const {
            workspace_id,
            source_route_id,
            target_route_id,
            element_id,
            choice_value,
        } = body

        if (!workspace_id || !source_route_id || !target_route_id) {
            return NextResponse.json(
                { error: 'workspace_id, source_route_id, target_route_id are required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('route_edges')
            .insert({
                workspace_id,
                source_route_id,
                target_route_id,
                element_id: element_id || null,
                choice_value: choice_value || null,
            })
            .select()
            .single()

        if (error) {
            console.error('[route_edges POST]', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ edge: data }, { status: 201 })

    } catch (err) {
        console.error('[route_edges POST] unexpected:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}