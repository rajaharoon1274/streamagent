import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// ── POST /api/videos/[id]/logo — upload logo to Supabase Storage ──────────────
export async function POST(request, { params }) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user, supabase } = auth

    // Verify ownership
    const { data: ws } = await supabase
        .from('workspaces').select('id').eq('owner_id', user.id).single()
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { data: video } = await supabase
        .from('videos').select('id, branding')
        .eq('id', params.id).eq('workspace_id', ws.id).single()
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

    // Parse multipart form
    let formData
    try { formData = await request.formData() }
    catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }) }

    const file = formData.get('logo')
    if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No logo file provided' }, { status: 400 })
    }

    // Validate
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif']
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Use PNG, JPG, SVG, or WebP.' }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Logo must be under 2 MB.' }, { status: 400 })
    }

    // Upload to Supabase Storage: bucket = 'logos', path = workspace_id/video_id/logo.ext
    const ext = file.type.split('/')[1].replace('svg+xml', 'svg')
    const path = `${ws.id}/${params.id}/logo.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, buffer, {
            contentType: file.type,
            upsert: true,        // overwrite if already exists
        })

    if (uploadError) {
        console.error('[Logo Upload]', uploadError.message)
        return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(path)

    // Save logoUrl into branding JSONB on the video
    const updatedBranding = { ...(video.branding || {}), logoUrl: publicUrl }
    const { error: dbError } = await supabase
        .from('videos')
        .update({ branding: updatedBranding })
        .eq('id', params.id)

    if (dbError) {
        console.error('[Logo DB Update]', dbError.message)
        return NextResponse.json({ error: 'Failed to save logo URL.' }, { status: 500 })
    }

    return NextResponse.json({ logoUrl: publicUrl })
}

// ── DELETE /api/videos/[id]/logo — remove logo ───────────────────────────────
export async function DELETE(request, { params }) {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { user, supabase } = auth

    const { data: ws } = await supabase
        .from('workspaces').select('id').eq('owner_id', user.id).single()
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { data: video } = await supabase
        .from('videos').select('id, branding')
        .eq('id', params.id).eq('workspace_id', ws.id).single()
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

    // Remove from storage (try all common extensions)
    for (const ext of ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif']) {
        await supabase.storage
            .from('logos')
            .remove([`${ws.id}/${params.id}/logo.${ext}`])
    }

    // Clear logoUrl from branding JSONB
    const updatedBranding = { ...(video.branding || {}), logoUrl: '' }
    await supabase.from('videos').update({ branding: updatedBranding }).eq('id', params.id)

    return NextResponse.json({ success: true })
}