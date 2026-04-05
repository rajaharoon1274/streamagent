import { createAdminClient } from '@/lib/supabase/server'
import { validatePassword } from '@/lib/password'
import { sendVerificationEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    // ── 1. Input validation ─────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const { valid, errors: pwErrors } = validatePassword(password)
    if (!valid) {
      return NextResponse.json(
        { error: pwErrors[0], errors: pwErrors },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // ── 2. Check if email already exists ────────────────────────
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const emailTaken = existingUsers?.users?.some(
      u => u.email?.toLowerCase() === email.toLowerCase()
    )
    if (emailTaken) {
      return NextResponse.json(
        { error: 'Unable to create account with this email. Try a different email or sign in if you already have an account.' },
        { status: 400 }
      )
    }

    // ── 3. Create user in Supabase Auth (unconfirmed) ───────────
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: false,
      user_metadata: {
        first_name: firstName || '',
        last_name: lastName || '',
      },
    })

    if (createError || !newUser?.user) {
      console.error('[Signup] Create user failed:', createError)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    // ── 4. Generate 8-digit OTP ─────────────────────────────────
    const rawCode = String(Math.floor(10000000 + Math.random() * 90000000))
    const codeHash = await bcrypt.hash(rawCode, 12)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // ── 5. Invalidate any previous unused codes for this email ──
    await supabaseAdmin
      .from('email_verifications')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('used', false)

    // ── 6. Store new hashed code ────────────────────────────────
    const { error: insertError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        user_id: newUser.user.id,
        email: email.toLowerCase(),
        code_hash: codeHash,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('[Signup] Insert verification failed:', insertError)
      // Roll back user creation
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    // ── 6b. Store password hash in profiles for old-password check ─
    const passwordHash = await bcrypt.hash(password, 12)
    await supabaseAdmin
      .from('profiles')
      .update({ password_hash: passwordHash })
      .eq('id', newUser.user.id)

    // ── 7. Send OTP email via Resend ────────────────────────────
    try {
      await sendVerificationEmail({
        email,
        firstName: firstName || '',
        code: rawCode,
      })
    } catch (emailErr) {
      // Email failure is non-fatal — user and verification code are created.
      // They can use the resend endpoint to get a new code.
      console.error('[Signup] Email send failed:', emailErr)
    }

    // ── 8. Return success ───────────────────────────────────────
    return NextResponse.json({
      step: 'verify',
      email: email.toLowerCase(),
      message: 'Account created. Check your email for the verification code.',
    })

  } catch (err) {
    if (err?.code === 'PGRST301' || err?.message?.includes('policy')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    if (err?.message?.includes('fetch failed') || err?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 })
    }
    console.error('[Signup] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
