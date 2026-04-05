import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function doSignOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function POST() {
  try {
    await doSignOut()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Logout] Error:', err)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}

// Allows navigating directly to /api/auth/logout to log out
export async function GET(request) {
  try {
    await doSignOut()
  } catch {}
  return NextResponse.redirect(new URL('/login', request.url))
}
