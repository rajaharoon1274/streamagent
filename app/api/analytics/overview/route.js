import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        // Workspace
        const { data: ws } = await supabase
            .from('workspaces')
            .select('id, plan_tier, bandwidth_used_bytes, bandwidth_limit_bytes')
            .eq('owner_id', user.id)
            .single()
        if (!ws) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

        // Video stats
        const { data: videos, error: vErr } = await supabase
            .from('videos')
            .select('id, title, views, plays, eng, created_at, status, thumbnail_url, color')
            .eq('workspace_id', ws.id)
            .order('created_at', { ascending: false })

        if (vErr) throw vErr

        const totalVideos = videos?.length ?? 0
        const totalViews = videos?.reduce((s, v) => s + (v.views || 0), 0) ?? 0
        const totalPlays = videos?.reduce((s, v) => s + (v.plays || 0), 0) ?? 0
        const avgEngagement = totalVideos
            ? Math.round(videos.reduce((s, v) => s + (v.eng || 0), 0) / totalVideos)
            : 0

        // Lead stats
        const { count: totalLeads } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', ws.id)

        // Conversion rate = leads / views * 100
        const conversionRate = totalViews > 0
            ? Math.round((totalLeads / totalViews) * 1000) / 10   // 1 decimal
            : 0

        // Recent leads (last 5)
        const { data: recentLeads } = await supabase
            .from('leads')
            .select('id, email, name, first_name, last_name, created_at, status, source')
            .eq('workspace_id', ws.id)
            .order('created_at', { ascending: false })
            .limit(5)

        // 7-day sparkline for views
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
        const { data: dailyViews } = await supabase
            .from('video_analytics')
            .select('date, views, plays')
            .in('video_id', (videos || []).map(v => v.id))
            .gte('date', sevenDaysAgo)
            .order('date', { ascending: true })

        return NextResponse.json({
            totalVideos,
            totalViews,
            totalPlays,
            totalLeads: totalLeads ?? 0,
            avgEngagement,
            conversionRate,
            recentLeads: recentLeads ?? [],
            topVideos: (videos ?? []).slice(0, 5),
            dailyViews: dailyViews ?? [],
            workspace: ws,
        })
    } catch (err) {
        console.error('[analytics/overview]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}