import { createAdminClient } from '@/lib/supabase/server'
import { validatePassword } from '@/lib/password'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// ── GET /api/auth/reset-password?token= ─────────────────────────────────────
// Validates a reset token — called on page mount before showing the form.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')?.trim()

    if (!token) {
      return NextResponse.json({ valid: false, reason: 'missing' })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const supabaseAdmin = createAdminClient()

    const { data: record } = await supabaseAdmin
      .from('password_resets')
      .select('id, expires_at, used, email')
      .eq('token_hash', tokenHash)
      .single()

    if (!record) {
      return NextResponse.json({ valid: false, reason: 'invalid' })
    }
    if (record.used) {
      return NextResponse.json({ valid: false, reason: 'used' })
    }
    if (new Date() > new Date(record.expires_at)) {
      // Mark expired token as used to clean up
      await supabaseAdmin
        .from('password_resets')
        .update({ used: true })
        .eq('id', record.id)
      return NextResponse.json({ valid: false, reason: 'expired' })
    }

    return NextResponse.json({ valid: true })

  } catch (err) {
    console.error('[Reset GET] Error:', err)
    // On error, return invalid — safer than showing the form
    return NextResponse.json({ valid: false, reason: 'error' })
  }
}

// ── POST /api/auth/reset-password ────────────────────────────────────────────
// Sets a new password after validating the token.
export async function POST(request) {
  try {
    const { token, password, confirmPassword } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // ── 1. Passwords match ───────────────────────────────────────
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // ── 2. Password strength ─────────────────────────────────────
    const { valid, errors: pwErrors } = validatePassword(password)
    if (!valid) {
      return NextResponse.json(
        { error: pwErrors[0], errors: pwErrors },
        { status: 400 }
      )
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex')
    const supabaseAdmin = createAdminClient()

    // ── 3. Validate token ────────────────────────────────────────
    const { data: record } = await supabaseAdmin
      .from('password_resets')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .single()

    if (!record) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      )
    }

    if (new Date() > new Date(record.expires_at)) {
      await supabaseAdmin
        .from('password_resets')
        .update({ used: true })
        .eq('id', record.id)
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 410 }
      )
    }

    // ── 4. Check not same as current password ───────────────────
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('password_hash')
      .eq('id', record.user_id)
      .single()

    if (profile?.password_hash) {
      const isSame = await bcrypt.compare(password, profile.password_hash)
      if (isSame) {
        return NextResponse.json(
          { error: 'New password must be different from your current password.', field: 'password' },
          { status: 400 }
        )
      }
    }

    // ── 5. Update password in Supabase Auth ──────────────────────
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      record.user_id,
      { password }
    )

    if (updateError) {
      console.error('[Reset] Update password error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    // ── 6. Store new hash for future old-password checks ─────────
    const newHash = await bcrypt.hash(password, 12)
    await supabaseAdmin
      .from('profiles')
      .update({ password_hash: newHash })
      .eq('id', record.user_id)

    // ── 7. Revoke ALL sessions — password changed, force re-login ─
    await supabaseAdmin.auth.admin.signOut(record.user_id, 'global')

    // ── 8. Mark token as used ────────────────────────────────────
    await supabaseAdmin
      .from('password_resets')
      .update({ used: true })
      .eq('id', record.id)

    return NextResponse.json({ success: true })

  } catch (err) {
    if (err?.message?.includes('fetch failed') || err?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 })
    }
    console.error('[Reset] Error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
