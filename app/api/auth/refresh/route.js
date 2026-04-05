import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token: session.refresh_token,
      })

    if (refreshError || !refreshed.session) {
      return NextResponse.json(
        { error: 'Session refresh failed. Please log in again.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      expires_at: refreshed.session.expires_at,
    })

  } catch (err) {
    if (err?.code === 'PGRST301' || err?.message?.includes('policy')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    if (err?.message?.includes('fetch failed') || err?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 })
    }
    console.error('[Refresh] Error:', err)
    return NextResponse.json(
      { error: 'Refresh failed. Please log in again.' },
      { status: 500 }
    )
  }
}
