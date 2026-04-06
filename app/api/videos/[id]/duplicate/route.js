import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Helper: verify the video belongs to the authenticated user's workspace.
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

// ── POST /api/videos/[id]/duplicate ─────────────────────────────────
export async function POST(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  if (!params.id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
  }

  try {
    const video = await getOwnedVideo(supabase, params.id, user.id)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Destructure out auto-managed fields so they are not present in the insert
    // Setting to `undefined` still passes the key; destructuring drops it entirely
    const {
      id: _id,
      created_at: _ca,
      updated_at: _ua,
      ...videoFields
    } = video

    const duplicated = {
      ...videoFields,
      title: `${video.title} (Copy)`,
      published_at: null, // copy starts unpublished
    }

    const { data: newVideo, error } = await supabase
      .from('videos')
      .insert([duplicated])
      .select()
      .single()

    if (error) {
      console.error('[Video Duplicate Error]', error.code, error.message, error.details)
      return NextResponse.json({ error: error.message || 'Duplicate failed' }, { status: 500 })
    }

    if (!newVideo) {
      console.error('[Video Duplicate] No data returned from insert')
      return NextResponse.json({ error: 'Duplicate failed - no data returned' }, { status: 500 })
    }

    console.log('[Video Duplicate Success]', newVideo.id)
    return NextResponse.json(newVideo)
  } catch (err) {
    console.error('[Video Duplicate Exception]', err.message, err.stack)
    return NextResponse.json({ error: err.message || 'Duplicate failed' }, { status: 500 })
  }
}
