import { createAdminClient } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const supabaseAdmin = createAdminClient()

    // ── Look up user — always return success to not leak existence ──
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const user = usersData?.users?.find(u => u.email?.toLowerCase() === cleanEmail)

    if (!user) {
      // Silently succeed — don't reveal if email exists
      return NextResponse.json({ success: true })
    }

    // ── Only send reset to verified accounts ────────────────────
    // Unverified users should complete verification first.
    // We don't leak this difference to the client.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email_verified, first_name')
      .eq('id', user.id)
      .single()

    if (!profile?.email_verified) {
      return NextResponse.json({ success: true })
    }

    // ── Block password reset for Google-only accounts ────────────
    // These accounts have no password identity — sending a reset
    // would let anyone add a password to a Google account via email.
    const identities = user.identities || []
    const providers  = user.app_metadata?.providers || []
    const hasGoogle   = providers.includes('google') || identities.some(i => i.provider === 'google')
    const hasPassword = providers.includes('email')  || identities.some(i => i.provider === 'email')
    if (hasGoogle && !hasPassword) {
      // Silently succeed — don't reveal that this is a Google-only account
      return NextResponse.json({ success: true })
    }

    // ── Generate secure token (raw = sent in link, hash = stored) ─
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { error: insertError } = await supabaseAdmin
      .from('password_resets')
      .insert({
        user_id: user.id,
        email: cleanEmail,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('[Forgot] Insert token error:', insertError)
      // Still return success — don't leak internal errors
      return NextResponse.json({ success: true })
    }

    // ── Send reset email via Resend ──────────────────────────────
    const { origin } = new URL(request.url)
    const resetUrl = `${origin}/reset-password?token=${rawToken}`
    await sendPasswordResetEmail({
      email: cleanEmail,
      firstName: profile.first_name || '',
      resetUrl,
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    if (err?.message?.includes('fetch failed') || err?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 })
    }
    console.error('[Forgot] Error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
