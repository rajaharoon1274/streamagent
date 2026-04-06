import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ── PATCH /api/elements/[id] ────────────────────────────────────
export async function PATCH(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth
  let body
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  // Only these fields can be updated — video_id and workspace_id never change
  const ALLOWED_FIELDS = [
    'x', 'y', 'w', 'h',
    'z_index', 'opacity',
    'props',
    'timing',       // JSONB: { in, duration, animIn, animOut, animSpeed }
    'conditions',
    'gate',
    'lead_routing',
    'route_id',
    'sort_order',
  ]

  const updates = {}
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('elements')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('[PATCH element]', error.message)
    return NextResponse.json({ error: 'Update failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ element: updated })
}

// ── DELETE /api/elements/[id] ───────────────────────────────────
export async function DELETE(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth
  const { error } = await supabase
    .from('elements')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('[DELETE element]', error.message)
    return NextResponse.json({ error: 'Delete failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}