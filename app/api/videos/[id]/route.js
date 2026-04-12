import { requireAuth } from '@/lib/auth'
import { deleteCloudflareVideo } from '@/lib/cloudflare'
import { NextResponse } from 'next/server'

async function getOwnedVideo(supabase, videoId, userId) {
  const { data: ws } = await supabase
    .from('workspaces').select('id').eq('owner_id', userId).single()
  if (!ws) return null

  const { data: video } = await supabase
    .from('videos').select('*')
    .eq('id', videoId)
    .eq('workspace_id', ws.id)
    .single()

  return video || null
}

// ── GET /api/videos/[id] ────────────────────────────────────────
export async function GET(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth
  const video = await getOwnedVideo(supabase, params.id, user.id)
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }
  return NextResponse.json(video)
}

// ── PATCH /api/videos/[id] ──────────────────────────────────────
export async function PATCH(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth
  const video = await getOwnedVideo(supabase, params.id, user.id)
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  let body
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const ALLOWED_FIELDS = [
    'title', 'privacy', 'folder_id', 'password',
    'password_headline', 'password_hint', 'comments_enabled',
    'branding', 'landing_page', 'color', 'eng', 'playerMode',
  ]

  const updates = {}
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (body.lp !== undefined) updates.landing_page = body.lp

  // When branding contains autoplay:true, enforce muted=true
  if (updates.branding && updates.branding.autoplay === true) {
    updates.branding.muted = true
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  if (updates.title !== undefined && !String(updates.title).trim()) {
    return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
  }

  if (updates.privacy === 'published' && !video.published_at) {
    updates.published_at = new Date().toISOString()
  }

  const { data: updated, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', params.id)
    .select().single()

  if (error) {
    console.error('[Video PATCH]', error.message)
    return NextResponse.json({ error: 'Update failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json(updated)
}

// ── DELETE /api/videos/[id] ─────────────────────────────────────
export async function DELETE(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth
  const video = await getOwnedVideo(supabase, params.id, user.id)
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  if (video.stream_uid) {
    const { count } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('stream_uid', video.stream_uid)

    if (count === 1) {
      await deleteCloudflareVideo(video.stream_uid)
    }
  }

  const { error } = await supabase.from('videos').delete().eq('id', params.id)

  if (error) {
    console.error('[Video DELETE]', error.message)
    return NextResponse.json({ error: 'Delete failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}