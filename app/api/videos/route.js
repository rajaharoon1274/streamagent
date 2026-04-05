import { requireAuth, getWorkspace } from '@/lib/auth'
import { getUploadUrl } from '@/lib/cloudflare'
import { NextResponse } from 'next/server'

// ── GET /api/videos ─────────────────────────────────────────────
// Used by Library.jsx via SWR to fetch all videos for this workspace.
// Supports query params: ?folder=uuid&status=ready&sort=newest|oldest|views
export async function GET(request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { session, supabase } = auth

  const workspace = await getWorkspace(supabase, session.user.id)
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder')    // folder UUID filter
  const status = searchParams.get('status')    // 'ready' | 'processing' etc
  const sort   = searchParams.get('sort') || 'newest'

  let query = supabase.from('videos').select('*').eq('workspace_id', workspace.id)

  if (folder) query = query.eq('folder_id', folder)
  if (status) query = query.eq('status', status)

  if (sort === 'oldest')    query = query.order('created_at', { ascending: true })
  else if (sort === 'views') query = query.order('views', { ascending: false })
  else                       query = query.order('created_at', { ascending: false }) // newest

  const { data, error } = await query

  if (error) {
    console.error('[Videos GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

// ── POST /api/videos ────────────────────────────────────────────
// Called BEFORE the file upload begins.
// Creates the DB record and returns the Cloudflare TUS upload URL.
export async function POST(request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { session, supabase } = auth

  const workspace = await getWorkspace(supabase, session.user.id)
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // Parse request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { fileName, fileSize, title, folderId } = body

  if (!fileName || !fileSize) {
    return NextResponse.json({ error: 'fileName and fileSize are required' }, { status: 400 })
  }

  // ── Check plan video limit ───────────────────────────────────
  const { count, error: countError } = await supabase
    .from('videos')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)
    .not('status', 'eq', 'error') // do not count errored videos against limit

  if (!countError) {
    const LIMITS = { core: 10, pro: 25, enterprise: 999999 }
    const limit = LIMITS[workspace.plan_tier] ?? 10
    if ((count ?? 0) >= limit) {
      return NextResponse.json({
        error: `You have reached your ${limit}-video limit on the ${workspace.plan_tier} plan. Upgrade to add more videos.`,
        code: 'PLAN_LIMIT_REACHED',
        limit,
        count,
      }, { status: 403 })
    }
  }

  // ── Get Cloudflare direct upload URL ────────────────────────
  let uploadUrl, streamUid
  try {
    ;({ uploadUrl, streamUid } = await getUploadUrl(fileName, fileSize))
  } catch (err) {
    console.error('[Videos POST] CF error:', err.message)
    return NextResponse.json({
      error: 'Failed to initialise upload. Please check your Cloudflare credentials.',
    }, { status: 500 })
  }

  // ── Create video record in Supabase ─────────────────────────
  const videoTitle = (title || '').trim() || fileName.replace(/\.[^.]+$/, '')

  const { data: video, error: dbError } = await supabase.from('videos').insert({
    workspace_id:    workspace.id,
    stream_uid:      streamUid,
    title:           videoTitle,
    status:          'uploading',
    file_size_bytes: fileSize,
    folder_id:       folderId || null,
    upload_date:     new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    }),
  }).select().single()

  if (dbError || !video) {
    console.error('[Videos POST] DB insert error:', dbError?.message)
    return NextResponse.json({
      error: 'Failed to create video record. Please try again.',
    }, { status: 500 })
  }

  return NextResponse.json({ video, uploadUrl, streamUid }, { status: 201 })
}
