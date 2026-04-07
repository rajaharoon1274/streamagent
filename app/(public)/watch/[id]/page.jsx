// app/(public)/watch/[id]/page.jsx
import { notFound } from 'next/navigation'
import WatchClient from './WatchClient'

// ── Fetch from our player API (SSR) ──────────────────────────────────────────
async function fetchPlayerData(videoId) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/player/${videoId}`, {
            next: { revalidate: 10 },
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

// ── Page (SSR) ────────────────────────────────────────────────────────────────
export default async function WatchPage({ params }) {
    const data = await fetchPlayerData(params.id)

    if (!data?.video) notFound()

    return <WatchClient data={data} videoId={params.id} />
}

// ── Metadata ──────────────────────────────────────────────────────────────────
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