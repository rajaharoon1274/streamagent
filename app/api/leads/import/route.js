import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, getWorkspace } from '@/lib/auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
)

function isValidEmail(email = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return { headers: [], rows: [] }

    // Simple CSV parse (handles quoted fields)
    function parseLine(line) {
        const result = []
        let current = ''
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
            const ch = line[i]
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"'
                    i++
                } else {
                    inQuotes = !inQuotes
                }
            } else if (ch === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
            } else {
                current += ch
            }
        }
        result.push(current.trim())
        return result
    }

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
    const rows = lines.slice(1).map(parseLine)

    return { headers, rows }
}

/* ─── POST /api/leads/import ─────��───────────────────────────────────────── */
export async function POST(req) {
    try {
        const auth = await requireAuth()
        if (auth instanceof NextResponse) return auth
        const { user, supabase } = auth

        const workspace = await getWorkspace(supabase, user.id)
        if (!workspace) {
            return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
        }

        const formData = await req.formData()
        const file = formData.get('file')

        if (!file) {
            return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 })
        }

        const text = await file.text()
        const { headers, rows } = parseCSV(text)

        if (rows.length === 0) {
            return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 })
        }

        // Map common header variations to our DB column names
        const headerMap = {
            email: 'email',
            'email_address': 'email',
            'e-mail': 'email',
            name: 'name',
            'full_name': 'name',
            'first_name': 'first_name',
            'last_name': 'last_name',
            phone: 'phone',
            'phone_number': 'phone',
            status: 'status',
            tags: 'tags',
            notes: 'notes',
            score: 'score',
            source: 'source',
        }

        const colIndex = {}
        headers.forEach((h, i) => {
            const mapped = headerMap[h]
            if (mapped) colIndex[mapped] = i
        })

        if (colIndex.email === undefined) {
            return NextResponse.json(
                { error: 'CSV must contain an "email" column' },
                { status: 400 }
            )
        }

        const validStatuses = ['New', 'Contacted', 'Qualified', 'Closed']
        let imported = 0
        let updated = 0
        let skipped = 0
        const errors = []

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const email = (row[colIndex.email] || '').trim().toLowerCase()

            if (!email || !isValidEmail(email)) {
                skipped++
                errors.push({ row: i + 2, reason: `Invalid email: "${email}"` })
                continue
            }

            const name = colIndex.name !== undefined ? row[colIndex.name]?.trim() || null : null
            const nameParts = (name || '').split(/\s+/)
            const first_name = colIndex.first_name !== undefined
                ? row[colIndex.first_name]?.trim() || null
                : nameParts[0] || null
            const last_name = colIndex.last_name !== undefined
                ? row[colIndex.last_name]?.trim() || null
                : nameParts.slice(1).join(' ') || null

            let status = colIndex.status !== undefined ? row[colIndex.status]?.trim() : 'New'
            if (!validStatuses.includes(status)) status = 'New'

            const tags = colIndex.tags !== undefined
                ? (row[colIndex.tags] || '').split(/[;,]/).map(t => t.trim()).filter(Boolean)
                : []

            const leadData = {
                workspace_id: workspace.id,
                email,
                name: name || [first_name, last_name].filter(Boolean).join(' ') || null,
                first_name,
                last_name,
                phone: colIndex.phone !== undefined ? row[colIndex.phone]?.trim() || null : null,
                status,
                score: colIndex.score !== undefined ? parseInt(row[colIndex.score], 10) || 0 : 0,
                source: colIndex.source !== undefined ? row[colIndex.source]?.trim() || 'csv_import' : 'csv_import',
                tags,
                notes: colIndex.notes !== undefined ? row[colIndex.notes]?.trim() || null : null,
                updated_at: new Date().toISOString(),
            }

            // Upsert by email within this workspace
            const { data: existing } = await supabaseAdmin
                .from('leads')
                .select('id')
                .eq('workspace_id', workspace.id)
                .eq('email', email)
                .limit(1)
                .single()

            if (existing) {
                // Update existing lead (don't overwrite workspace_id)
                const { workspace_id: _wid, ...updateData } = leadData
                await supabaseAdmin
                    .from('leads')
                    .update(updateData)
                    .eq('id', existing.id)
                updated++
            } else {
                // Insert new lead
                leadData.created_at = new Date().toISOString()
                leadData.responses = []
                leadData.rewatched = false
                leadData.rewatch_count = 0
                leadData.lead_magnet_sent = false

                const { error } = await supabaseAdmin
                    .from('leads')
                    .insert(leadData)

                if (error) {
                    skipped++
                    errors.push({ row: i + 2, reason: error.message })
                } else {
                    imported++
                }
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            updated,
            skipped,
            total: rows.length,
            errors: errors.slice(0, 20), // Only return first 20 errors
        })
    } catch (err) {
        console.error('[leads/import] unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}