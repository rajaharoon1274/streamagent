import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Find user by email
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const user = usersData?.users?.find(
      u => u.email?.toLowerCase() === cleanEmail
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check email_verified in profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email_verified, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (!profile?.email_verified) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: cleanEmail,
        firstName: profile.first_name,
        lastName: profile.last_name,
      },
    })

  } catch (err) {
    if (err?.code === 'PGRST301' || err?.message?.includes('policy')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    if (err?.message?.includes('fetch failed') || err?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 })
    }
    console.error('[Login] Error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
