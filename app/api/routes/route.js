import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// ── GET /api/routes?workspace_id=xxx ─────────────────────────────────────────
export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const workspace_id = searchParams.get('workspace_id')

    if (!workspace_id) {
        return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
    }

    const { data, error } = await supabaseService
        .from('routes')
        .select('*')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('[routes GET]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ routes: data })
}

// ── POST /api/routes ──────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const body = await req.json()
        const {
            workspace_id,
            video_id,
            title,
            is_root = false,
            x = 300,
            y = 180,
            color = '#4F6EF7',
        } = body

        if (!workspace_id || !title) {
            return NextResponse.json(
                { error: 'workspace_id and title are required' },
                { status: 400 }
            )
        }

        // Generate a short readable ID
        const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

        const { data, error } = await supabaseService
            .from('routes')
            .insert({
                id,
                workspace_id,
                video_id: video_id || null,
                title,
                is_root,
                x,
                y,
                color,
                choice_points: [],
                cta_points: [],
                landing_page: {},
            })
            .select()
            .single()

        if (error) {
            console.error('[routes POST]', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ route: data }, { status: 201 })

    } catch (err) {
        console.error('[routes POST] unexpected:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}