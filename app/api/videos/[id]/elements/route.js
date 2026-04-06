import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ── GET /api/videos/[id]/elements ───────────────────────────────
export async function GET(request, { params }) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: elements, error } = await supabase
    .from('elements')
    .select('*')
    .eq('video_id', params.id)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[GET elements]', error.message)
    return NextResponse.json({ error: 'Failed to fetch elements' }, { status: 500 })
  }

  return NextResponse.json({ elements })
}

// ── POST /api/videos/[id]/elements ──────────────────────────────
export async function POST(request, { params }) {
  const supabase = createClient()
  const adminSupabase = createAdminClient()  // ← bypasses RLS

  // Auth check — still uses regular client
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  if (!body.type) {
    return NextResponse.json({ error: 'Element type is required' }, { status: 400 })
  }

  // Step 1 — use adminSupabase to bypass RLS for workspace lookup
  const { data: ws, error: wsError } = await adminSupabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (wsError || !ws) {
    console.error('[POST element] workspace error:', wsError?.message)
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // Step 2 — use adminSupabase to bypass RLS for video lookup
  const { data: video, error: videoError } = await adminSupabase
    .from('videos')
    .select('id, workspace_id')
    .eq('id', params.id)
    .eq('workspace_id', ws.id)
    .maybeSingle()

  if (videoError || !video) {
    console.error('[POST element] video error:', videoError?.message)
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  // Step 3 — get next sort_order
  const { data: lastElement } = await adminSupabase
    .from('elements')
    .select('sort_order')
    .eq('video_id', params.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSortOrder = (lastElement?.sort_order ?? -1) + 1

  // Step 4 — timing JSONB
  const timing = {
    in:        body.timing?.in        ?? 0,
    duration:  body.timing?.duration  ?? 0,
    animIn:    body.timing?.animIn    ?? 'fadeIn',
    animOut:   body.timing?.animOut   ?? 'fadeOut',
    animSpeed: body.timing?.animSpeed ?? 0.4,
  }

  // Step 5 — insert using adminSupabase
  const { data: element, error } = await adminSupabase
    .from('elements')
    .insert({
      video_id:     params.id,
      type:         body.type,
      x:            body.x            ?? 10,
      y:            body.y            ?? 10,
      w:            body.w            ?? 200,
      h:            body.h            ?? 50,
      z_index:      body.z_index      ?? 1,
      opacity:      body.opacity      ?? 1.0,
      props:        body.props        ?? {},
      timing,
      conditions:   body.conditions   ?? [],
      gate:         body.gate         ?? null,
      lead_routing: body.lead_routing ?? {},
      route_id:     body.route_id     ?? null,
      sort_order:   nextSortOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('[POST element]', error.message)
    return NextResponse.json({ error: 'Failed to create element' }, { status: 500 })
  }

  return NextResponse.json({ element }, { status: 201 })
}