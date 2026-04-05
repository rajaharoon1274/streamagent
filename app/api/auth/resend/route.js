import { createAdminClient } from '@/lib/supabase/server'
import { sendVerificationEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const supabaseAdmin = createAdminClient()

    // ── Rate limit: only allow resend every 60 seconds ──────────
    const { data: lastCode } = await supabaseAdmin
      .from('email_verifications')
      .select('created_at')
      .eq('email', cleanEmail)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastCode) {
      const secondsSinceLast = (Date.now() - new Date(lastCode.created_at)) / 1000
      if (secondsSinceLast < 60) {
        const wait = Math.ceil(60 - secondsSinceLast)
        return NextResponse.json(
          { error: `Please wait ${wait} second${wait !== 1 ? 's' : ''} before requesting a new code.` },
          { status: 429 }
        )
      }
    }

    // ── Find the user ───────────────────────────────────────────
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const user = usersData?.users?.find(
      u => u.email?.toLowerCase() === cleanEmail
    )

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      )
    }

    // ── Check not already verified ──────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email_verified')
      .eq('id', user.id)
      .single()

    if (profile?.email_verified) {
      return NextResponse.json(
        { error: 'This email is already verified. Please log in.' },
        { status: 400 }
      )
    }

    // ── Invalidate old codes ────────────────────────────────────
    await supabaseAdmin
      .from('email_verifications')
      .update({ used: true })
      .eq('email', cleanEmail)
      .eq('used', false)

    // ── Generate and store new code ─────────────────────────────
    const rawCode = String(Math.floor(10000000 + Math.random() * 90000000))
    const codeHash = await bcrypt.hash(rawCode, 12)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    await supabaseAdmin
      .from('email_verifications')
      .insert({
        user_id: user.id,
        email: cleanEmail,
        code_hash: codeHash,
        expires_at: expiresAt,
      })

    // ── Send email ──────────────────────────────────────────────
    await sendVerificationEmail({
      email: cleanEmail,
      firstName: user.user_metadata?.first_name || '',
      code: rawCode,
    })

    return NextResponse.json({
      success: true,
      message: 'Verification code resent. Check your email.',
    })

  } catch (err) {
    if (err?.code === 'PGRST301' || err?.message?.includes('policy')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    if (err?.message?.includes('fetch failed') || err?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 })
    }
    console.error('[Resend OTP] Error:', err)
    return NextResponse.json(
      { error: 'Failed to resend code. Please try again.' },
      { status: 500 }
    )
  }
}
