import { requireAuth, getWorkspace } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ── PATCH /api/folders/[id] — rename or change colour ───────────
export async function PATCH(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const workspace = await getWorkspace(supabase, user.id)
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const body = await request.json()
  const updates = {}
  if (body.name?.trim())  updates.name  = body.name.trim()
  if (body.color)         updates.color = body.color

  const { data, error } = await supabase.from('folders')
    .update(updates)
    .eq('id', params.id)
    .eq('workspace_id', workspace.id) // ownership check
    .select().single()

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json(data)
}

// ── DELETE /api/folders/[id] ─────────────────────────────────────
// Videos in the folder have their folder_id set to NULL (ON DELETE SET NULL).
// They are NOT deleted — they move to "All Videos".
export async function DELETE(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const workspace = await getWorkspace(supabase, user.id)
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { error } = await supabase.from('folders')
    .delete()
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
