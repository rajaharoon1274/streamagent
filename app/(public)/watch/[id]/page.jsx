export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import WatchClient from './WatchClient'
import PixelInjector from '@/components/pixels/PixelInjector'

async function fetchPlayerData(videoId) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/player/${videoId}`, {
            cache: 'no-store',
        })
        if (!res.ok) return null
        return await res.json()
    } catch { return null }
}

export default async function WatchPage({ params }) {
    const data = await fetchPlayerData(params.id)
    if (!data?.video) notFound()

    const workspace = data.workspace  // ✅ already has pixel IDs from player API

    console.log('[WatchPage] pixels:', {
        meta: workspace?.meta_pixel_id ?? 'NULL',
        tiktok: workspace?.tiktok_pixel_id ?? 'NULL',
        google: workspace?.google_ads_id ?? 'NULL',
        linkedin: workspace?.linkedin_partner_id ?? 'NULL',
    })

    return (
        <>
            <PixelInjector workspace={workspace} />
            <WatchClient data={data} videoId={params.id} />
        </>
    )
}

export async function generateMetadata({ params }) {
    const data = await fetchPlayerData(params.id)
    if (!data?.video) return { title: 'Video Not Found' }
    const { video } = data
    const lp = video.landing_page || {}
    return {
        title: lp.seoTitle || video.title || 'Watch Video',
        description: lp.seoDesc || '',
        openGraph: {
            title: lp.seoTitle || video.title,
            description: lp.seoDesc || '',
            images: video.thumbnail_url ? [{ url: video.thumbnail_url }] : [],
        },
    }
}