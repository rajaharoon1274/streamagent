import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Cloudflare calls this endpoint when a video finishes transcoding.
// Register the URL in: Cloudflare Dashboard -> Stream -> Webhooks -> Add webhook
export async function POST(request) {
  try {
    const rawBody = await request.text()
    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    // ── Verify signature if secret is configured ─────────────
    const secret = process.env.CLOUDFLARE_WEBHOOK_SECRET
    if (secret) {
      const sig       = request.headers.get('webhook-signature') || ''
      const timestamp = request.headers.get('webhook-timestamp') || ''
      const expected  = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex')

      if (sig !== expected) {
        console.error('[CF Webhook] Signature mismatch')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const supabase  = createAdminClient()
    const eventType = payload?.action || payload?.type || ''
    const streamUid = payload?.uid || payload?.result?.uid

    if (!streamUid) {
      return NextResponse.json({ ok: true }) // nothing to act on
    }

    // ── Video transcoding finished ───────────────────────────
    if (eventType === 'stream.video.finished' || payload?.status?.state === 'ready') {
      const durationSec = Math.round(payload?.duration || payload?.result?.duration || 0)
      const thumbUrl    = `https://videodelivery.net/${streamUid}/thumbnails/thumbnail.jpg`

      // Build resolution string if available
      const w = payload?.meta?.width  || payload?.result?.input?.width
      const h = payload?.meta?.height || payload?.result?.input?.height
      const resolution = w && h ? `${w} \u00d7 ${h}` : null

      await supabase.from('videos').update({
        status:           'ready',
        duration_seconds: durationSec || null,
        thumbnail_url:    thumbUrl,
        resolution:       resolution,
      }).eq('stream_uid', streamUid)

      console.log(`[CF Webhook] Ready: ${streamUid}`)
    }

    // ── Video transcoding failed ─────────────────────────────
    if (eventType === 'stream.video.errored' || payload?.status?.state === 'error') {
      await supabase.from('videos').update({
        status: 'error',
      }).eq('stream_uid', streamUid)

      console.error(`[CF Webhook] Error: ${streamUid}`)
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[CF Webhook] Unexpected error:', err.message)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
