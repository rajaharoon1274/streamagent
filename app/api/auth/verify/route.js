import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// GET /api/auth/verify?email= — check if a valid pending verification exists
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: record } = await supabaseAdmin
      .from('email_verifications')
      .select('expires_at, attempts')
      .eq('email', email)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!record) {
      return NextResponse.json({ valid: false })
    }

    if (new Date() > new Date(record.expires_at)) {
      return NextResponse.json({ valid: false })
    }

    if (record.attempts >= 5) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ valid: true })

  } catch (err) {
    console.error('[Verify GET] Error:', err)
    // On error, let the page through — POST will reject bad codes anyway
    return NextResponse.json({ valid: true })
  }
}

export async function POST(request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanCode = String(code).trim()

    if (cleanCode.length !== 8 || !/^\d{8}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: 'Code must be exactly 8 digits' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // ── 1. Find the latest valid verification record ────────────
    const { data: record, error: fetchError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('email', cleanEmail)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !record) {
      return NextResponse.json(
        { error: 'No pending verification found. Please sign up again.' },
        { status: 404 }
      )
    }

    // ── 2. Check expiry ─────────────────────────────────────────
    if (new Date() > new Date(record.expires_at)) {
      await supabaseAdmin
        .from('email_verifications')
        .update({ used: true })
        .eq('id', record.id)
      return NextResponse.json(
        { error: 'Verification code has expired. Request a new one.' },
        { status: 410 }
      )
    }

    // ── 3. Check max attempts ───────────────────────────────────
    if (record.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new code.' },
        { status: 429 }
      )
    }

    // ── 4. Compare code with bcrypt hash ────────────────────────
    const isValid = await bcrypt.compare(cleanCode, record.code_hash)

    if (!isValid) {
      await supabaseAdmin
        .from('email_verifications')
        .update({ attempts: record.attempts + 1 })
        .eq('id', record.id)

      const remaining = 4 - record.attempts
      return NextResponse.json({
        error: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
      }, { status: 400 })
    }

    // ── 5. Code is valid — mark as used ─────────────────────────
    await supabaseAdmin
      .from('email_verifications')
      .update({ used: true })
      .eq('id', record.id)

    // ── 6. Confirm user email in Supabase Auth ──────────────────
    await supabaseAdmin.auth.admin.updateUserById(record.user_id, {
      email_confirm: true,
    })

    // ── 7. Mark email_verified in profiles table ────────────────
    await supabaseAdmin
      .from('profiles')
      .update({ email_verified: true })
      .eq('id', record.user_id)

    // ── 8. Generate magic link token for session establishment ──
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: cleanEmail,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
      })

    if (linkError || !linkData?.properties) {
      console.error('[Verify] Magic link generation failed:', linkError)
      // Verification succeeded but session creation failed
      return NextResponse.json({
        success: true,
        message: 'Email verified. Please log in.',
        redirect: '/login',
      })
    }

    // ── 9. Return token for frontend to establish session ───────
    const { token_hash, type } = linkData.properties

    return NextResponse.json({
      success: true,
      token_hash,
      type,
      message: 'Email verified successfully.',
    })

  } catch (err) {
    if (err?.code === 'PGRST301' || err?.message?.includes('policy')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    if (err?.message?.includes('fetch failed') || err?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 })
    }
    console.error('[Verify] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
