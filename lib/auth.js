import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Use in any protected API route.
 * Returns { user, supabase } if authenticated.
 * Returns a 401 NextResponse if not.
 *
 * Usage:
 *   const auth = await requireAuth()
 *   if (auth instanceof NextResponse) return auth
 *   const { user, supabase } = auth
 */
export async function requireAuth() {
  const supabase = createClient()

  // getUser() is secure — verifies token with Supabase Auth server
  // getSession() is insecure on server — reads from cookie without verification
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { user, supabase }
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