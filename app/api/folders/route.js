import { requireAuth, getWorkspace } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ── GET /api/folders ────────────────────────────────────────────
export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const workspace = await getWorkspace(supabase, user.id)
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  return NextResponse.json(data || [])
}

// ── POST /api/folders ───────────────────────────────────────────
export async function POST(request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const workspace = await getWorkspace(supabase, user.id)
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const { name, color } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
  }

  const { data, error } = await supabase.from('folders').insert({
    workspace_id: workspace.id,
    name: name.trim(),
    color: color || '#4F6EF7',
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
