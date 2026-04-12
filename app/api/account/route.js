import { NextResponse } from 'next/server'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

const ALLOWED_PIXEL_FIELDS = [
    'meta_pixel_id',
    'tiktok_pixel_id',
    'google_ads_id',
    'linkedin_partner_id',
    'meta_capi_dataset_id',
    'meta_capi_token',
    'cv_lead',
]

/* ── GET /api/account ─────────────────────────────────────────────────────── */
export async function GET(req) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        const workspace = await getWorkspace(supabase, user.id)
        if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

        const supabaseAdmin = createAdminClient()
        const { data, error } = await supabaseAdmin
            .from('workspaces')
            .select(`
                id, name, plan_tier,
                meta_pixel_id, tiktok_pixel_id, google_ads_id, linkedin_partner_id,
                meta_capi_dataset_id, meta_capi_token, cv_lead
            `)
            .eq('id', workspace.id)
            .single()

        if (error) {
            console.error('[account GET] supabase error:', error.message)
            return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
        }

        return NextResponse.json({ workspace: data })
    } catch (err) {
        console.error('[account GET]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/* ── PATCH /api/account ───────────────────────────────────────────────────── */
export async function PATCH(req) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        const workspace = await getWorkspace(supabase, user.id)
        if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

        const body = await req.json()

        // Build updates — only whitelisted fields
        const updates = {}
        for (const field of ALLOWED_PIXEL_FIELDS) {
            if (field in body) {
                if (field === 'cv_lead') {
                    // numeric field — keep 0, only null if explicitly null
                    updates[field] = body[field] === null ? null : (parseFloat(body[field]) || 0)
                } else {
                    // text fields — empty string → null (clear the field)
                    const val = body[field]
                    updates[field] = (val === null || val === '' || val === undefined) ? null : String(val).trim()
                }
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        console.log('[account PATCH] workspace:', workspace.id, 'updates:', updates)

        const supabaseAdmin = createAdminClient()
        const { data, error } = await supabaseAdmin
            .from('workspaces')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', workspace.id)
            .select(`
                id, meta_pixel_id, tiktok_pixel_id, google_ads_id,
                linkedin_partner_id, meta_capi_dataset_id, meta_capi_token, cv_lead
            `)
            .single()

        if (error) {
            console.error('[account PATCH] supabase error:', error.message, error.details)
            return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 })
        }

        console.log('[account PATCH] saved:', data)
        return NextResponse.json({ success: true, workspace: data })
    } catch (err) {
        console.error('[account PATCH]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}