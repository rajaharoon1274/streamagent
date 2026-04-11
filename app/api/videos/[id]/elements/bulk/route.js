import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ── POST /api/videos/[id]/elements/bulk ─────────────────────────
// Updates multiple existing elements at once (called after drag-drop reorder)
// Body: { elements: [{ id, x, y, w, h, sort_order, ...optional }] }
export async function POST(request, { params }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  let body
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { elements } = body

  if (!Array.isArray(elements)) {
    return NextResponse.json({ error: 'elements must be an array' }, { status: 400 })
  }
  if (elements.length === 0) {
    return NextResponse.json({ elements: [] })
  }
  // Update each element individually — bulk update by ID
  // We use Promise.all to run all updates in parallel (fast)
  const results = await Promise.all(
    elements.map(async (el) => {
      // Build only the fields that were sent
      const update = {}
      if (el.x !== undefined) update.x = el.x
      if (el.y !== undefined) update.y = el.y
      if (el.w !== undefined) update.w = el.w
      if (el.h !== undefined) update.h = el.h
      if (el.sort_order !== undefined) update.sort_order = el.sort_order
      if (el.z_index !== undefined) update.z_index = el.z_index
      if (el.opacity !== undefined) update.opacity = el.opacity
      if (el.props !== undefined) update.props = el.props
      if (el.timing !== undefined) update.timing = el.timing
      if (el.gate !== undefined) update.gate = el.gate
      if (el.conditions !== undefined) update.conditions = el.conditions
      if (el.route_id !== undefined) update.route_id = el.route_id

      const { data, error } = await supabase
        .from('elements')
        .update(update)
        .eq('id', el.id)
        .eq('video_id', params.id)   // extra safety — must belong to this video
        .select()
        .single()

      if (error) {
        console.error(`[bulk] element ${el.id} error:`, error.message)
        return null
      }
      return data
    })
  )

  // Filter out any that failed
  const saved = results.filter(Boolean)

  if (saved.length === 0) {
    return NextResponse.json({ error: 'Failed to save elements' }, { status: 500 })
  }

  return NextResponse.json({ elements: saved })
}