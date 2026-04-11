import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, getWorkspace } from '@/lib/auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

function escapeCSV(val) {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

/* ─── POST /api/leads/export ─────────────────────────────────────────────── */
export async function POST(req) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        const workspace = await getWorkspace(supabase, user.id)
        if (!workspace) {
            return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
        }

        const body = await req.json()
        const { video_id, status, search, date_from, date_to, lead_ids } = body

        let query = supabaseAdmin
            .from('leads')
            .select(`
        *,
        videos:video_id ( title )
      `)
            .eq('workspace_id', workspace.id)
            .order('created_at', { ascending: false })

        // If specific lead IDs are provided (bulk export), use those
        if (lead_ids && lead_ids.length > 0) {
            query = query.in('id', lead_ids)
        } else {
            // Apply same filters as the list endpoint
            if (video_id) query = query.eq('video_id', video_id)
            if (status && status !== 'all') query = query.eq('status', status)
            if (date_from) query = query.gte('created_at', date_from)
            if (date_to) query = query.lte('created_at', date_to + 'T23:59:59.999Z')
            if (search) {
                const s = `%${search}%`
                query = query.or(`email.ilike.${s},name.ilike.${s},phone.ilike.${s}`)
            }
        }

        // Supabase max 1000 rows per request — paginate for large exports
        query = query.limit(5000)

        const { data, error } = await query

        if (error) {
            console.error('[leads/export] query error:', error)
            return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 })
        }

        // Build CSV
        const headers = [
            'Name', 'Email', 'Phone', 'Status', 'Score',
            'Video', 'Source', 'Device',
            'UTM Source', 'UTM Medium', 'UTM Campaign',
            'Watch Depth %', 'Tags', 'Notes', 'Follow Up Date',
            'Created At',
        ]

        const rows = (data || []).map(lead => [
            escapeCSV(lead.name),
            escapeCSV(lead.email),
            escapeCSV(lead.phone),
            escapeCSV(lead.status),
            escapeCSV(lead.score),
            escapeCSV(lead.videos?.title || ''),
            escapeCSV(lead.source),
            escapeCSV(lead.device),
            escapeCSV(lead.utm_source),
            escapeCSV(lead.utm_medium),
            escapeCSV(lead.utm_campaign),
            escapeCSV(lead.watch_depth_pct),
            escapeCSV((lead.tags || []).join('; ')),
            escapeCSV(lead.notes),
            escapeCSV(lead.follow_up_date),
            escapeCSV(lead.created_at),
        ])

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="leads-export-${Date.now()}.csv"`,
            },
        })
    } catch (err) {
        console.error('[leads/export] unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}