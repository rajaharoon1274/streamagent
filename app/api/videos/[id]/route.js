import { requireAuth } from '@/lib/auth'
import { deleteCloudflareVideo } from '@/lib/cloudflare'
import { NextResponse } from 'next/server'

function slugify(text) {
  return String(text || '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 80) || 'video'
}

async function generateUniqueSlug(supabase, base, excludeVideoId) {
  const candidate = slugify(base)
  let slug = candidate, attempt = 0
  while (true) {
    const { data } = await supabase
      .from('landing_pages').select('id, video_id').eq('slug', slug)
    const conflict = (data || []).find(r => r.video_id !== excludeVideoId)
    if (!conflict) return slug
    attempt++
    slug = `${candidate}-${attempt}`
  }
}

async function getOwnedVideo(supabase, videoId, userId) {
  const { data: ws } = await supabase
    .from('workspaces').select('id').eq('owner_id', userId).single()
  if (!ws) return null
  const { data: video } = await supabase
    .from('videos').select('*')
    .eq('id', videoId).eq('workspace_id', ws.id).single()
  return video || null
}

// ── GET /api/videos/[id] ──────────────────────────────────────────────────────
export async function GET(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const video = await getOwnedVideo(supabase, params.id, user.id)
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

  // Attach slug + lead count
  const [{ data: lpRow }, { count: leadCount }] = await Promise.all([
    supabase.from('landing_pages').select('slug').eq('video_id', params.id).maybeSingle(),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('video_id', params.id),
  ])

  return NextResponse.json({
    ...video,
    slug: lpRow?.slug ?? null,
    lead_count: leadCount ?? 0,
  })
}

// ── PATCH /api/videos/[id] ────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const video = await getOwnedVideo(supabase, params.id, user.id)
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

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

  if (updates.branding?.autoplay === true) updates.branding.muted = true

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
    .from('videos').update(updates).eq('id', params.id).select().single()

  if (error) {
    console.error('[Video PATCH]', error.message)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // ── Slug upsert when landing_page is saved ────────────────────────────────
  let slug = null
  if (updates.landing_page !== undefined) {
    const lp = updates.landing_page || {}
    const { data: existingRow } = await supabase
      .from('landing_pages').select('id, slug').eq('video_id', params.id).maybeSingle()

    if (existingRow) {
      const desiredSlug = lp.slug ? slugify(lp.slug) : null
      if (desiredSlug && desiredSlug !== existingRow.slug) {
        const unique = await generateUniqueSlug(supabase, desiredSlug, params.id)
        await supabase.from('landing_pages')
          .update({ slug: unique, status: updated.privacy === 'published' ? 'published' : 'draft', updated_at: new Date().toISOString() })
          .eq('id', existingRow.id)
        slug = unique
      } else {
        await supabase.from('landing_pages')
          .update({ status: updated.privacy === 'published' ? 'published' : 'draft', updated_at: new Date().toISOString() })
          .eq('id', existingRow.id)
        slug = existingRow.slug
      }
    } else {
      slug = await generateUniqueSlug(supabase, lp.slug || updated.title || 'video', params.id)
      await supabase.from('landing_pages').insert({
        video_id: params.id,
        workspace_id: video.workspace_id,
        name: updated.title || '',
        slug,
        status: updated.privacy === 'published' ? 'published' : 'draft',
        config: lp,
      })
    }
  } else {
    const { data: existingRow } = await supabase
      .from('landing_pages').select('slug').eq('video_id', params.id).maybeSingle()
    slug = existingRow?.slug ?? null
  }

  return NextResponse.json({ ...updated, slug })
}

// ── DELETE /api/videos/[id] ───────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const video = await getOwnedVideo(supabase, params.id, user.id)
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

  if (video.stream_uid) {
    const { count } = await supabase
      .from('videos').select('id', { count: 'exact', head: true })
      .eq('stream_uid', video.stream_uid)
    if (count === 1) await deleteCloudflareVideo(video.stream_uid)
  }

  const { error } = await supabase.from('videos').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

  return NextResponse.json({ success: true })
}