import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { dispatchLead } from '@/lib/integrations/dispatch'
import { sendLeadMagnetEmail } from '@/lib/email'
import { sendMetaCAPILead } from '@/lib/integrations/meta-capi'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

function detectDevice(ua = '') {
    if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile'
    if (/ipad|tablet/i.test(ua)) return 'tablet'
    return 'desktop'
}

function extractUTMs(sourceUrl = '') {
    try {
        const url = new URL(sourceUrl)
        return {
            utm_source: url.searchParams.get('utm_source') || null,
            utm_medium: url.searchParams.get('utm_medium') || null,
            utm_campaign: url.searchParams.get('utm_campaign') || null,
        }
    } catch {
        return { utm_source: null, utm_medium: null, utm_campaign: null }
    }
}

function isValidEmail(email = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/* ── GET /api/leads ─────────────────────────────────────────────────────── */
export async function GET(req) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        const workspace = await getWorkspace(supabase, user.id)
        if (!workspace) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

        const { searchParams } = new URL(req.url)
        const video_id = searchParams.get('video_id')
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const date_from = searchParams.get('date_from')
        const date_to = searchParams.get('date_to')
        const tag = searchParams.get('tag')
        const sort = searchParams.get('sort') || 'newest'
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)))
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabaseAdmin
            .from('leads')
            .select('*, videos:video_id ( id, title, thumbnail_url )', { count: 'exact' })
            .eq('workspace_id', workspace.id)

        if (video_id) query = query.eq('video_id', video_id)
        if (status && status !== 'all') query = query.eq('status', status)
        if (tag) query = query.contains('tags', [tag])
        if (date_from) query = query.gte('created_at', date_from)
        if (date_to) query = query.lte('created_at', date_to + 'T23:59:59.999Z')
        if (search) {
            const s = `%${search}%`
            query = query.or(`email.ilike.${s},name.ilike.${s},phone.ilike.${s}`)
        }

        switch (sort) {
            case 'oldest': query = query.order('created_at', { ascending: true }); break
            case 'score_high': query = query.order('score', { ascending: false }); break
            case 'score_low': query = query.order('score', { ascending: true }); break
            case 'name_az': query = query.order('name', { ascending: true }); break
            case 'name_za': query = query.order('name', { ascending: false }); break
            default: query = query.order('created_at', { ascending: false }); break
        }

        const { data, error, count } = await query.range(from, to)
        if (error) return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })

        return NextResponse.json({
            leads: data || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        })
    } catch (err) {
        console.error('[leads GET]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/* ── POST /api/leads ────────────────────────────────────────────────────── */
export async function POST(req) {
    try {
        const body = await req.json()
        const {
            workspace_id, video_id, element_id, email, name, phone,
            watch_depth_pct, visitor_fingerprint, source_url, lid, responses,
        } = body

        if (!workspace_id || !video_id) {
            return NextResponse.json(
                { error: 'workspace_id and video_id are required' },
                { status: 400 }
            )
        }

        const isSurveyEmail = email?.endsWith('@noemail.internal')
        if (!isSurveyEmail && (!email || !isValidEmail(email))) {
            return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
        }

        // Survey merge
        if (lid) {
            const { data: existing } = await supabaseAdmin
                .from('leads').select('id, responses').eq('id', lid).eq('workspace_id', workspace_id).single()
            if (existing) {
                await supabaseAdmin.from('leads').update({
                    updated_at: new Date().toISOString(),
                    responses: [...(existing.responses || []), ...(responses || [])],
                }).eq('id', existing.id)
                return NextResponse.json({ success: true, lead_id: existing.id, merged: true })
            }
        }

        const ua = req.headers.get('user-agent') || ''
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
        const nameParts = (name || '').trim().split(/\s+/)
        const first_name = nameParts[0] || null
        const last_name = nameParts.slice(1).join(' ') || null
        const utms = extractUTMs(source_url)

        const { data: lead, error } = await supabaseAdmin
            .from('leads')
            .insert({
                workspace_id,
                video_id,
                element_id: element_id || null,
                email: isSurveyEmail ? null : email.trim().toLowerCase(),
                name: name?.trim() || null,
                first_name,
                last_name,
                phone: phone?.trim() || null,
                status: 'New',
                score: 0,
                source: req.headers.get('referer') || null,
                source_url: source_url || null,
                utm_source: utms.utm_source,
                utm_medium: utms.utm_medium,
                utm_campaign: utms.utm_campaign,
                device: detectDevice(ua),
                watch_depth_pct: watch_depth_pct ?? null,
                visitor_fingerprint: visitor_fingerprint || null,
                ip_address: ip,
                tags: [],
                responses: responses || [],
                rewatched: false,
                rewatch_count: 0,
                lead_magnet_sent: false,
            })
            .select('*')
            .single()

        if (error) {
            console.error('[leads] insert error:', error)
            return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
        }

        // ── Fire-and-forget: CRM dispatch + webhooks ──────────────────────────
        dispatchLead(supabaseAdmin, workspace_id, lead)

        // ── Fire-and-forget: Lead magnet email if element is cta-download ─────
        if (element_id && lead.email) {
            _maybeSendLeadMagnet(element_id, lead).catch(err =>
                console.error('[leads] lead magnet error:', err.message)
            )
        }

        // ── Fire-and-forget: Meta CAPI (Enterprise only) ──────────────────────
        if (lead.email) {
            _maybeFireMetaCAPI(workspace_id, lead, source_url).catch(err =>
                console.error('[leads] meta capi error:', err.message)
            )
        }

        return NextResponse.json({ success: true, id: lead.id }, { status: 201 })

    } catch (err) {
        console.error('[leads] unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/* ── Lead magnet helper ─────────────────────────────────────────────────── */
async function _maybeSendLeadMagnet(elementId, lead) {
    // Fetch the element to check if it's cta-download with a downloadUrl
    const { data: element } = await supabaseAdmin
        .from('elements')
        .select('type, props')
        .eq('id', elementId)
        .single()

    if (!element) return
    if (element.type !== 'cta-download') return

    const { downloadUrl, fileName, requireEmail } = element.props || {}
    if (!downloadUrl || !requireEmail) return

    // Fetch video for thumbnail + title
    const { data: video } = await supabaseAdmin
        .from('videos')
        .select('title, thumbnail_url, branding')
        .eq('id', lead.video_id)
        .single()

    await sendLeadMagnetEmail({
        email: lead.email,
        name: lead.name || lead.first_name || '',
        downloadUrl,
        fileName: fileName || 'Your Download',
        videoTitle: video?.title || '',
        thumbnailUrl: video?.thumbnail_url || '',
        agentName: video?.branding?.agentName || 'StreamAgent',
    })

    // Mark lead_magnet_sent
    await supabaseAdmin
        .from('leads')
        .update({ lead_magnet_sent: true, updated_at: new Date().toISOString() })
        .eq('id', lead.id)

    console.log(`[LeadMagnet] Sent to ${lead.email}: ${downloadUrl}`)
}

/* ── Meta CAPI helper ───────────────────────────────────────────────────── */
async function _maybeFireMetaCAPI(workspaceId, lead, sourceUrl) {
    const { data: workspace } = await supabaseAdmin
        .from('workspaces')
        .select('plan_tier, meta_capi_dataset_id, meta_capi_token, cv_lead')
        .eq('id', workspaceId)
        .single()

    if (!workspace) return
    await sendMetaCAPILead({ workspace, lead, sourceUrl })
}