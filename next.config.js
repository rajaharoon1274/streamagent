const dns = require('dns')
dns.setDefaultResultOrder('ipv4first')

/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' " +
                            "https://embed.cloudflarestream.com " +
                            "https://*.cloudflarestream.com " +
                            "https://connect.facebook.net " +
                            "https://analytics.tiktok.com " +
                            "https://www.googletagmanager.com " +
                            "https://www.google-analytics.com " +
                            "https://snap.licdn.com",
                            "frame-src 'self' " +
                            "https://iframe.cloudflarestream.com " +
                            "https://*.cloudflarestream.com",
                            "media-src 'self' https://*.cloudflarestream.com blob: data:",
                            "img-src 'self' data: https: blob:",
                            "connect-src 'self' " +
                            "https://*.cloudflarestream.com " +
                            "wss://*.cloudflarestream.com " +
                            "https://*.supabase.co " +
                            "wss://*.supabase.co " +
                            "https://platform.dash.cloudflare.com " +
                            "https://connect.facebook.net " +
                            "https://analytics.tiktok.com " +
                            "https://www.google-analytics.com " +
                            "https://www.googletagmanager.com " +
                            "https://snap.licdn.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com data:",
                            "worker-src blob:",
                        ].join('; '),
                    },
                ],
            },
        ]
    },
}

module.exports = nextConfig