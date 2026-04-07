// app/api/player/[video_id]/verify/route.js
// ─────────────────────────────────────────────────────────────────────────────
// Verify password for password-protected videos.
// Returns a short-lived session token stored in the client.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export async function POST(req, { params }) {
    const { video_id } = params
    const { password } = await req.json()

    if (!video_id || !password) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: video } = await supabase
        .from('videos')
        .select('id, password, privacy')
        .eq('id', video_id)
        .eq('privacy', 'password')
        .single()

    if (!video) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (video.password !== password) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Return a simple grant — client stores this in sessionStorage
    return NextResponse.json({ granted: true, video_id })
}