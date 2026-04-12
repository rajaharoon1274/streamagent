export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Script from 'next/script'
import LandingPageClient from './LandingPageClient'

async function fetchLandingData(slug) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/landing-page/${encodeURIComponent(slug)}`, {
            cache: 'no-store',
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

// ── SSR meta tags ─────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
    const data = await fetchLandingData(params.slug)
    if (!data?.video) return { title: 'Page Not Found' }

    const { video } = data
    const lp = video.landing_page || {}

    const title = lp.seoTitle || video.title || 'Watch Video'
    const description = lp.seoDescription || lp.seoDesc || lp.subtext || lp.subheadline || ''
    const ogImage = lp.seoImage || video.thumbnail_url || ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const pageUrl = `${appUrl}/p/${params.slug}`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: pageUrl,
            type: 'website',
            images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ogImage ? [ogImage] : [],
        },
        other: video.stream_uid
            ? { 'og:video': `https://iframe.cloudflarestream.com/${video.stream_uid}` }
            : {},
    }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function LandingPage({ params }) {
    const data = await fetchLandingData(params.slug)
    if (!data?.video) notFound()

    const { video, workspace, slug } = data

    return (
        <>
            {/* ── Pixel scripts — injected server-side via Next.js Script ── */}
            {workspace?.meta_pixel_id && (
                <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
          n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
          t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${workspace.meta_pixel_id}');
          fbq('track','PageView');
        `}</Script>
            )}

            {workspace?.tiktok_pixel_id && (
                <Script id="tiktok-pixel" strategy="afterInteractive">{`
          !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once",
          "ready","alias","group","enableCookie","disableCookie"];
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(
          Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};
          ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
          n=d.createElement("script");n.type="text/javascript";n.async=!0;
          n.src=i+"?sdkid="+e+"&lib="+t;e=d.getElementsByTagName("script")[0];
          e.parentNode.insertBefore(n,e)};ttq.load('${workspace.tiktok_pixel_id}');
          ttq.page();}(window,document,'ttq');
        `}</Script>
            )}

            {workspace?.google_ads_id && (
                <>
                    <Script
                        id="gtag-js"
                        strategy="afterInteractive"
                        src={`https://www.googletagmanager.com/gtag/js?id=${workspace.google_ads_id}`}
                    />
                    <Script id="gtag-config" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];
            function gtag(){dataLayer.push(arguments);}
            gtag('js',new Date());
            gtag('config','${workspace.google_ads_id}');
          `}</Script>
                </>
            )}

            {workspace?.linkedin_partner_id && (
                <Script id="linkedin-pixel" strategy="afterInteractive">{`
          _linkedin_partner_id="${workspace.linkedin_partner_id}";
          window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];
          window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          (function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};
          window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];
          var b=document.createElement("script");b.type="text/javascript";b.async=true;
          b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
          s.parentNode.insertBefore(b,s)})(window.lintrk);
        `}</Script>
            )}

            <LandingPageClient video={video} workspace={workspace} slug={slug} />
        </>
    )
}