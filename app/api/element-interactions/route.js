import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

function detectDevice(ua = '') {
    if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile'
    if (/ipad|tablet/i.test(ua)) return 'tablet'
    return 'desktop'
}

export async function POST(req) {
    try {
        const body = await req.json()
        const {
            workspace_id,
            video_id,
            element_id,
            interaction_type,
            value = {},
            visitor_fingerprint,
        } = body

        if (!workspace_id || !video_id || !interaction_type) {
            return NextResponse.json(
                { error: 'workspace_id, video_id and interaction_type are required' },
                { status: 400 }
            )
        }

        const ua = req.headers.get('user-agent') || ''

        const { error } = await supabase
            .from('element_interactions')
            .insert({
                workspace_id,
                video_id,
                element_id: element_id || null,
                interaction_type,
                value: value ?? {},
                visitor_fingerprint: visitor_fingerprint || null,
            })

        if (error) {
            console.error('[element-interactions] insert error:', error)
            return NextResponse.json({ error: 'Failed to save interaction' }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 201 })

    } catch (err) {
        console.error('[element-interactions] unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}