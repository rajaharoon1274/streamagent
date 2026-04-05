import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Use in any protected API route.
 * Returns { session, supabase } if authenticated.
 * Returns a 401 NextResponse if not.
 *
 * Usage:
 *   const auth = await requireAuth()
 *   if (auth instanceof NextResponse) return auth
 *   const { session, supabase } = auth
 */
export async function requireAuth() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { session, supabase }
}

/**
 * Get the authenticated user's workspace
 */
export async function getWorkspace(supabase, userId) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, plan_tier, name, bandwidth_limit_bytes, bandwidth_used_bytes, bandwidth_gated, bandwidth_degraded')
    .eq('owner_id', userId)
    .single()

  if (error || !data) return null
  return data
}
