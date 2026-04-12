import { NextResponse } from 'next/server'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

const ALLOWED_WORKSPACE_FIELDS = [
    'name',
    'meta_pixel_id', 'tiktok_pixel_id', 'google_ads_id',
    'linkedin_partner_id', 'meta_capi_dataset_id', 'meta_capi_token',
    'cv_lead',
]

const ALLOWED_PROFILE_FIELDS = [
    'first_name', 'last_name', 'company', 'phone', 'timezone', 'avatar_url',
]

// ── GET /api/account ──────────────────────────────────────────────────────────
export async function GET(req) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        const workspace = await getWorkspace(supabase, user.id)
        if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

        const admin = createAdminClient()

        const [{ data: ws }, { data: profile }] = await Promise.all([
            admin.from('workspaces')
                .select(`id, name, plan_tier,
          meta_pixel_id, tiktok_pixel_id, google_ads_id,
          linkedin_partner_id, meta_capi_dataset_id, meta_capi_token,
          cv_lead, bandwidth_used_bytes, bandwidth_limit_bytes,
          bandwidth_addon_tb, created_at`)
                .eq('id', workspace.id)
                .single(),
            admin.from('profiles')
                .select('first_name, last_name, company, phone, timezone, avatar_url, email_verified')
                .eq('id', user.id)
                .single(),
        ])

        return NextResponse.json({
            workspace: ws,
            profile: { ...profile, email: user.email, id: user.id },
        })
    } catch (err) {
        console.error('[account GET]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// ── PATCH /api/account ────────────────────────────────────────────────────────
export async function PATCH(req) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        const workspace = await getWorkspace(supabase, user.id)
        if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

        const body = await req.json()
        const admin = createAdminClient()

        // ── Profile fields ────────────────────────────────────────────
        const profileUpdates = {}
        for (const f of ALLOWED_PROFILE_FIELDS) {
            if (f in body) profileUpdates[f] = body[f] ?? null
        }

        // ── Workspace fields ──────────────────────────────────────────
        const wsUpdates = {}
        for (const f of ALLOWED_WORKSPACE_FIELDS) {
            if (f in body) {
                if (f === 'cv_lead') {
                    wsUpdates[f] = body[f] === null ? null : (parseFloat(body[f]) || 0)
                } else if (f === 'name') {
                    wsUpdates[f] = String(body[f] || '').trim()
                } else {
                    const val = body[f]
                    wsUpdates[f] = (val === null || val === '' || val === undefined)
                        ? null : String(val).trim()
                }
            }
        }

        // ── Password change ───────────────────────────────────────────
        if (body.newPassword) {
            if (!body.newPassword || body.newPassword.length < 8) {
                return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
            }
            const { error: pwErr } = await admin.auth.admin.updateUserById(user.id, {
                password: body.newPassword,
            })
            if (pwErr) return NextResponse.json({ error: pwErr.message }, { status: 400 })
        }

        // ── Email change ──────────────────────────────────────────────
        if (body.email && body.email !== user.email) {
            const { error: emErr } = await supabase.auth.updateUser({ email: body.email })
            if (emErr) return NextResponse.json({ error: emErr.message }, { status: 400 })
        }

        // Run updates in parallel
        const promises = []
        if (Object.keys(profileUpdates).length > 0) {
            promises.push(
                admin.from('profiles').update(profileUpdates).eq('id', user.id)
            )
        }
        if (Object.keys(wsUpdates).length > 0) {
            promises.push(
                admin.from('workspaces')
                    .update({ ...wsUpdates, updated_at: new Date().toISOString() })
                    .eq('id', workspace.id)
            )
        }

        await Promise.all(promises)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[account PATCH]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// ── DELETE /api/account ───────────────────────────────────────────────────────
export async function DELETE(req) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user } = auth
        const admin = createAdminClient()

        // Deletes cascade via FK: workspaces → videos → elements/leads/etc.
        const { error } = await admin.auth.admin.deleteUser(user.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[account DELETE]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}