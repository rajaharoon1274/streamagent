import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ── POST /api/auth/check-provider ───────────────────────────────────────────
// Called on password login failure to detect Google-only accounts.
// Returns { code: 'GOOGLE_ONLY' } so the UI can show a helpful message.
// Deliberately returns { code: null } for unknown emails to prevent enumeration.
export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ code: null })

    const supabaseAdmin = createAdminClient()
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const user = usersData?.users?.find(
      u => u.email?.toLowerCase() === email.toLowerCase().trim()
    )

    // Return null for unknown emails — don't reveal existence
    if (!user) return NextResponse.json({ code: null })

    const providers  = user.app_metadata?.providers || []
    const identities = user.identities || []

    const hasGoogle   = providers.includes('google') || identities.some(i => i.provider === 'google')
    const hasPassword = providers.includes('email')  || identities.some(i => i.provider === 'email')

    if (hasGoogle && !hasPassword) {
      return NextResponse.json({ code: 'GOOGLE_ONLY' })
    }

    return NextResponse.json({ code: null })
  } catch {
    return NextResponse.json({ code: null })
  }
}
