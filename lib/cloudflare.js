// lib/cloudflare.js
// All Cloudflare Stream API calls — server-side ONLY
// NEVER import this in a 'use client' file

const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_TOKEN   = process.env.CLOUDFLARE_STREAM_TOKEN
const CF_BASE    = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/stream`

// ─────────────────────────────────────────────────────────────────────
// getUploadUrl
// Gets a direct-upload URL from Cloudflare.
// The frontend uploads the file to this URL. Your server never sees the bytes.
// ─────────────────────────────────────────────────────────────────────
export async function getUploadUrl(fileName, fileSize) {
  const res = await fetch(`${CF_BASE}?direct_user=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(fileSize),
      'Upload-Metadata': [
        `name ${Buffer.from(fileName).toString('base64')}`,
        `filetype ${Buffer.from('video/mp4').toString('base64')}`,
      ].join(','),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CF upload URL failed [${res.status}]: ${text}`)
  }

  const uploadUrl = res.headers.get('Location')
  const streamUid = res.headers.get('stream-media-id')

  if (!uploadUrl || !streamUid) {
    throw new Error('Cloudflare did not return upload URL or stream UID')
  }

  return { uploadUrl, streamUid }
}

// ─────────────────────────────────────────────────────────────────────
// deleteCloudflareVideo
// Deletes a video from Cloudflare. Called when user deletes a video.
// 404 responses are ignored — video may already be gone.
// ─────────────────────────────────────────────────────────────────────
export async function deleteCloudflareVideo(streamUid) {
  if (!streamUid) return

  const res = await fetch(`${CF_BASE}/${streamUid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${CF_TOKEN}` },
  })

  if (!res.ok && res.status !== 404) {
    // Log but do not throw — DB delete should still proceed
    console.error(`[CF] Delete failed for ${streamUid}: ${res.status}`)
  }
}

// ─────────────────────────────────────────────────────────────────────
// getCloudflareVideo
// Fetches video metadata from Cloudflare.
// Used as fallback if webhook has not fired yet.
// ─────────────────────────────────────────────────────────────────────
export async function getCloudflareVideo(streamUid) {
  if (!streamUid) return null

  const res = await fetch(`${CF_BASE}/${streamUid}`, {
    headers: { Authorization: `Bearer ${CF_TOKEN}` },
  })

  if (!res.ok) return null

  const data = await res.json()
  return data.result || null
}
