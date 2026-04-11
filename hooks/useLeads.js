import useSWR from 'swr'
import { useCallback } from 'react'
import toast from 'react-hot-toast'

const fetcher = (url) => fetch(url).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
})

/* ─── useLeads ─────────────────────────────────────────────────────────────
   Fetches paginated, filtered leads list via GET /api/leads
   Returns { leads, total, page, totalPages, isLoading, isError, mutate }
────────────────────────────────────────────────────────────────────────── */
export function useLeads(filters = {}) {
    const params = new URLSearchParams()
    if (filters.video_id) params.set('video_id', filters.video_id)
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)
    if (filters.search) params.set('search', filters.search)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    if (filters.tag) params.set('tag', filters.tag)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.page) params.set('page', String(filters.page))
    if (filters.limit) params.set('limit', String(filters.limit))

    const qs = params.toString()
    const url = `/api/leads${qs ? '?' + qs : ''}`

    const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
        revalidateOnFocus: true,
        shouldRetryOnError: true,
        errorRetryCount: 3,
        refreshInterval: 15000,  // Poll every 15s for new leads
    })

    return {
        leads: data?.leads || [],
        total: data?.total || 0,
        page: data?.page || 1,
        limit: data?.limit || 25,
        totalPages: data?.totalPages || 1,
        isLoading,
        isError: !!error,
        mutate,
    }
}

/* ─── useLead ──────────────────────────────────────────────────────────────
   Fetches a single lead with events & video info via GET /api/leads/:id
────────────────────────────────────────────────────────────────────────── */
export function useLead(id) {
    const { data, error, isLoading, mutate } = useSWR(
        id ? `/api/leads/${id}` : null,
        fetcher,
        { revalidateOnFocus: true }
    )

    return {
        lead: data || null,
        isLoading,
        isError: !!error,
        mutate,
    }
}

/* ─── useLeadMutations ─────────────────────────────────────────────────────
   Provides updateLead, deleteLead, bulkUpdateStatus, bulkDelete, exportLeads, importLeads
───────────────────────────────���────────────────────────────────────────── */
export function useLeadMutations() {

    const updateLead = useCallback(async (id, updates) => {
        const res = await fetch(`/api/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Failed to update lead')
        }
        return res.json()
    }, [])

    const deleteLead = useCallback(async (id) => {
        const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Failed to delete lead')
        }
        return res.json()
    }, [])

    const bulkUpdateStatus = useCallback(async (ids, status) => {
        const results = await Promise.allSettled(
            ids.map(id =>
                fetch(`/api/leads/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status }),
                })
            )
        )
        const failed = results.filter(r => r.status === 'rejected').length
        if (failed > 0) {
            toast.error(`${failed} of ${ids.length} updates failed`)
        }
        return results
    }, [])

    const bulkDelete = useCallback(async (ids) => {
        const results = await Promise.allSettled(
            ids.map(id => fetch(`/api/leads/${id}`, { method: 'DELETE' }))
        )
        const failed = results.filter(r => r.status === 'rejected').length
        if (failed > 0) {
            toast.error(`${failed} of ${ids.length} deletes failed`)
        }
        return results
    }, [])

    const exportLeads = useCallback(async (filters = {}) => {
        const res = await fetch('/api/leads/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters),
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Export failed')
        }
        // Trigger download
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-export-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }, [])

    const importLeads = useCallback(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/leads/import', {
            method: 'POST',
            body: formData,
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Import failed')
        }
        return res.json()
    }, [])

    return { updateLead, deleteLead, bulkUpdateStatus, bulkDelete, exportLeads, importLeads }
}