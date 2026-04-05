import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')  // e.g. 'access_denied' when user cancels
  const next  = searchParams.get('next') ?? '/dashboard'

  // OAuth error — user cancelled or denied, or Google/Supabase returned an error
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=google_cancelled`)
  }

  if (code) {
    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
