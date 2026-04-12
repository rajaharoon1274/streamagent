'use client'
import { useEffect } from 'react'

/**
 * PixelInjector — 'use client' component
 * Injects Meta, TikTok, Google Ads, LinkedIn pixel SDKs via useEffect.
 * Defines window.firePixelEvent() for all 9 StreamAgent events.
 * Renders nothing — pure side-effect component.
 */
export default function PixelInjector({ workspace }) {
    const {
        meta_pixel_id = null,
        tiktok_pixel_id = null,
        google_ads_id = null,
        linkedin_partner_id = null,
        cv_lead = 20,
    } = workspace || {}

    useEffect(() => {
        // ── Meta Pixel SDK ────────────────────────────────────────────────────────
        if (meta_pixel_id && !window.fbq) {
            ; (function (f, b, e, v, n, t, s) {
                if (f.fbq) return
                n = f.fbq = function () {
                    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                }
                if (!f._fbq) f._fbq = n
                n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []
                t = b.createElement(e); t.async = true
                t.src = 'https://connect.facebook.net/en_US/fbevents.js'
                s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
            })(window, document, 'script')
            window.fbq('init', meta_pixel_id)
            window.fbq('track', 'PageView')
            window.__sa_meta_pixel = meta_pixel_id
            window.__sa_cv_lead = Number(cv_lead) || 20
        }

        // ── TikTok Pixel SDK ──────────────────────────────────────────────────────
        if (tiktok_pixel_id && !window.__sa_tiktok_pixel) {
            ; (function (w, d, t) {
                w.TiktokAnalyticsObject = t
                const ttq = (w[t] = w[t] || [])
                ttq.methods = [
                    'page', 'track', 'identify', 'instances', 'debug', 'on', 'off',
                    'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie',
                ]
                ttq.setAndDefer = function (obj, method) {
                    obj[method] = function () {
                        obj.push([method].concat(Array.prototype.slice.call(arguments, 0)))
                    }
                }
                for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i])
                ttq.instance = function (id) {
                    const inst = ttq._i?.[id] || []
                    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(inst, ttq.methods[i])
                    return inst
                }
                ttq.load = function (id, opts) {
                    const src = 'https://analytics.tiktok.com/i18n/pixel/events.js'
                    ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._i[id]._u = src
                    ttq._t = ttq._t || {}; ttq._t[id] = +new Date()
                    ttq._o = ttq._o || {}; ttq._o[id] = opts || {}
                    const s = d.createElement('script')
                    s.type = 'text/javascript'; s.async = true
                    s.src = `${src}?sdkid=${id}&lib=${t}`
                    const first = d.getElementsByTagName('script')[0]
                    first.parentNode.insertBefore(s, first)
                }
                ttq.load(tiktok_pixel_id)
                ttq.page()
            })(window, document, 'ttq')
            window.__sa_tiktok_pixel = tiktok_pixel_id
        }

        // ── Google Ads Tag ────────────────────────────────────────────────────────
        if (google_ads_id && !window.__sa_google_ads) {
            window.dataLayer = window.dataLayer || []
            window.gtag = function () { window.dataLayer.push(arguments) }
            window.gtag('js', new Date())
            window.gtag('config', google_ads_id)
            const s = document.createElement('script')
            s.async = true
            s.src = `https://www.googletagmanager.com/gtag/js?id=${google_ads_id}`
            document.head.appendChild(s)
            window.__sa_google_ads = google_ads_id
        }

        // ── LinkedIn Insight Tag ──────────────────────────────────────────────────
        if (linkedin_partner_id && !window.lintrk) {
            window._linkedin_partner_id = linkedin_partner_id
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || []
            window._linkedin_data_partner_ids.push(linkedin_partner_id)
                ; (function (l) {
                    if (!l) {
                        window.lintrk = function (a, b) { window.lintrk.q.push([a, b]) }
                        window.lintrk.q = []
                    }
                    const s = document.getElementsByTagName('script')[0]
                    const b = document.createElement('script')
                    b.type = 'text/javascript'; b.async = true
                    b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js'
                    s.parentNode.insertBefore(b, s)
                })(window.lintrk)
            window.__sa_linkedin_partner = linkedin_partner_id
        }

        // ── Universal Pixel Event Dispatcher ──────────────────────────────────────
        // Always defined — safe to call even with zero pixels configured
        window.firePixelEvent = function (eventName, params) {
            params = params || {}

            // Meta — 9 events
            if (typeof window.fbq === 'function' && window.__sa_meta_pixel) {
                const metaMap = {
                    VideoStart: () => window.fbq('trackCustom', 'VideoStart', params),
                    VideoPause: () => window.fbq('trackCustom', 'VideoPause', params),
                    VideoWatch25: () => window.fbq('trackCustom', 'VideoWatch25', params),
                    VideoWatch50: () => window.fbq('trackCustom', 'VideoWatch50', params),
                    VideoWatch75: () => window.fbq('trackCustom', 'VideoWatch75', params),
                    VideoWatch95: () => window.fbq('trackCustom', 'VideoWatch95', params),
                    GatePassed: () => window.fbq('trackCustom', 'GatePassed', params),
                    Lead: () => window.fbq('track', 'Lead', {
                        value: window.__sa_cv_lead || 20,
                        currency: 'USD',
                        content_name: params.video_title || '',
                    }),
                    BranchSelected: () => window.fbq('trackCustom', 'VideoChoice', params),
                }
                if (metaMap[eventName]) try { metaMap[eventName]() } catch (e) { /* silent */ }
            }

            // TikTok — mapped events
            if (typeof window.ttq !== 'undefined' && window.__sa_tiktok_pixel) {
                const ttqMap = {
                    VideoStart: 'ViewContent',
                    VideoWatch25: 'ViewContent',
                    VideoWatch50: 'ViewContent',
                    VideoWatch75: 'ViewContent',
                    VideoWatch95: 'ViewContent',
                    GatePassed: 'SubmitForm',
                    Lead: 'Lead',
                    BranchSelected: 'ClickButton',
                }
                const ttqEvent = ttqMap[eventName]
                if (ttqEvent) try { window.ttq.track(ttqEvent, params) } catch (e) { /* silent */ }
            }

            // Google Ads — all events forwarded
            if (typeof window.gtag === 'function' && window.__sa_google_ads) {
                try {
                    window.gtag('event', eventName, { send_to: window.__sa_google_ads, ...params })
                } catch (e) { /* silent */ }
            }

            // LinkedIn — Lead + GatePassed only
            if (typeof window.lintrk === 'function' && window.__sa_linkedin_partner) {
                const liMap = {
                    Lead: () => window.lintrk('track', { conversion_id: window.__sa_linkedin_partner }),
                    GatePassed: () => window.lintrk('track', { conversion_id: window.__sa_linkedin_partner }),
                }
                if (liMap[eventName]) try { liMap[eventName]() } catch (e) { /* silent */ }
            }

            // Dev debug log
            if (window.location.hostname === 'localhost') {
                console.log('[StreamAgent Pixel]', eventName, params)
            }
        }

        console.log('[PixelInjector] Loaded. Pixels:', {
            meta: !!meta_pixel_id,
            tiktok: !!tiktok_pixel_id,
            google: !!google_ads_id,
            linkedin: !!linkedin_partner_id,
        })

    }, [meta_pixel_id, tiktok_pixel_id, google_ads_id, linkedin_partner_id, cv_lead])

    return null
}