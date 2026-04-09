import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
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

export async function POST(req) {
    try {
        const body = await req.json()
        const {
            workspace_id,
            video_id,
            element_id,
            email,
            name,
            phone,
            watch_depth_pct,
            visitor_fingerprint,
            source_url,
            lid,
            responses,          // ✅ FIX 1 — destructure responses
        } = body

        // ── Validate required fields ──────────────────────────────────────��───
        if (!workspace_id || !video_id) {
            return NextResponse.json(
                { error: 'workspace_id and video_id are required' },
                { status: 400 }
            )
        }

        // ✅ FIX 2 — allow survey internal emails to bypass validation
        const isSurveyEmail = email?.endsWith('@noemail.internal')
        if (!isSurveyEmail && (!email || !isValidEmail(email))) {
            return NextResponse.json(
                { error: 'A valid email address is required' },
                { status: 400 }
            )
        }

        // ── lid: merge into existing lead ─────────────────────────────────────
        if (lid) {
            const { data: existing } = await supabase
                .from('leads')
                .select('id, responses')
                .eq('id', lid)
                .eq('workspace_id', workspace_id)
                .single()

            if (existing) {
                const merged = [
                    ...(existing.responses || []),
                    ...(responses || []),
                ]
                await supabase
                    .from('leads')
                    .update({
                        updated_at: new Date().toISOString(),
                        responses: merged,
                    })
                    .eq('id', existing.id)

                return NextResponse.json({ success: true, lead_id: existing.id, merged: true })
            }
        }

        // ── Get client metadata ───────────────────────────────────────────────
        const ua = req.headers.get('user-agent') || ''
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || null

        // ── Parse name ────────────────────────────────────────────────────────
        const nameParts = (name || '').trim().split(/\s+/)
        const first_name = nameParts[0] || null
        const last_name = nameParts.slice(1).join(' ') || null

        // ── UTMs ──────────────────────────────────────────────────────────────
        const utms = extractUTMs(source_url)

        // ── Insert lead ───────────────────────────────────────────────────────
        const { data: lead, error } = await supabase
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
                responses: responses || [],   // ✅ FIX 3 — use passed responses
                custom_fields: {},
                rewatched: false,
                rewatch_count: 0,
                lead_magnet_sent: false,
            })
            .select('id')
            .single()

        if (error) {
            console.error('[leads] insert error:', error)
            return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
        }

        return NextResponse.json({ success: true, id: lead.id }, { status: 201 })

    } catch (err) {
        console.error('[leads] unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}