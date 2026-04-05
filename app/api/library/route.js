import { requireAuth, getWorkspace } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ── GET /api/library ─────────────────────────────────────────────────────────
// Single endpoint that returns both folders and videos in one request.
// Replaces separate calls to /api/folders and /api/videos from the Library page.
// Uses Promise.all to fetch both in parallel after a single auth + workspace lookup.
export async function GET(request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { session, supabase } = auth

  const workspace = await getWorkspace(supabase, session.user.id)
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder')
  const status = searchParams.get('status')
  const sort   = searchParams.get('sort') || 'newest'

  // ── Build videos query ───────────────────────────────────────────────────
  let videosQuery = supabase
    .from('videos')
    .select('*')
    .eq('workspace_id', workspace.id)

  if (folder) videosQuery = videosQuery.eq('folder_id', folder)
  if (status) videosQuery = videosQuery.eq('status', status)

  if (sort === 'oldest')     videosQuery = videosQuery.order('created_at', { ascending: true })
  else if (sort === 'views') videosQuery = videosQuery.order('views',      { ascending: false })
  else                       videosQuery = videosQuery.order('created_at', { ascending: false })

  // ── Fetch folders + videos in parallel ───────────────────────────────────
  const [foldersResult, videosResult] = await Promise.all([
    supabase
      .from('folders')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('sort_order', { ascending: true }),
    videosQuery,
  ])

  if (foldersResult.error) {
    console.error('[Library GET] folders error:', foldersResult.error.message)
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
  if (videosResult.error) {
    console.error('[Library GET] videos error:', videosResult.error.message)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }

  return NextResponse.json(
    { folders: foldersResult.data || [], videos: videosResult.data || [] },
    {
      headers: {
        // Browser: always revalidate. CDN/edge: serve stale for 10s while revalidating.
        'Cache-Control': 'no-cache, s-maxage=10, stale-while-revalidate=30',
      },
    }
  )
}
