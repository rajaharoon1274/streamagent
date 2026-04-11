'use client'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { useLeads, useLead, useLeadMutations } from '@/hooks/useLeads'
import toast from 'react-hot-toast'

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Closed']
const STATUS_COLORS = {
  New: '#4F6EF7',
  Contacted: '#F5A623',
  Qualified: '#1ED8A0',
  Closed: '#FF6B6B',
}
function scoreColor(sc) { return sc >= 80 ? '#1ED8A0' : sc >= 60 ? '#F5A623' : '#FF6B6B' }
function initials(n) {
  if (!n) return '?'
  return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString()
}

/* ─── MAIN COMPONENT ───────────���─────────────────────────────────────── */
export default function Leads() {
  const { state, set } = useApp()

  // ── Filter / pagination state ──
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    video_id: '',
    sort: 'newest',
    page: 1,
    limit: 25,
  })

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  const searchTimer = useRef(null)
  const handleSearchChange = (val) => {
    setSearchInput(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: val, page: 1 }))
    }, 400)
  }

  // ── Data fetching ──
  const { leads, total, page, totalPages, isLoading, mutate } = useLeads(filters)
  const { updateLead, deleteLead, bulkUpdateStatus, bulkDelete, exportLeads, importLeads } = useLeadMutations()

  // ── Selection state ──
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false)

  // ── Detail drawer ──
  const [detailId, setDetailId] = useState(null)
  const { lead: detailLead, isLoading: detailLoading, mutate: mutateDetail } = useLead(detailId)

  // ── Import modal ──
  const [importModalOpen, setImportModalOpen] = useState(false)
  const fileInputRef = useRef(null)

  // ── Inline editing in drawer ──
  const [editNotes, setEditNotes] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editFollowUp, setEditFollowUp] = useState('')

  // Sync edit fields when detail lead loads
  useEffect(() => {
    if (detailLead) {
      setEditNotes(detailLead.notes || '')
      setEditTags((detailLead.tags || []).join(', '))
      setEditFollowUp(detailLead.follow_up_date || '')
    }
  }, [detailLead])

  // ── Select all toggle ──
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
      setSelectAll(false)
    } else {
      setSelectedIds(leads.map(l => l.id))
      setSelectAll(true)
    }
  }
  const toggleCheck = (id) => {
    setSelectedIds(p =>
      p.includes(id) ? p.filter(x => x !== id) : [...p, id]
    )
  }

  // ── Handlers ──
  const handleStatusChange = async (id, newStatus, prevStatus) => {
    try {
      await updateLead(id, { status: newStatus, _previous_status: prevStatus })
      toast.success(`Status → ${newStatus}`)
      mutate()
      if (detailId === id) mutateDetail()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDeleteLead = async (id) => {
    if (!confirm('Delete this lead permanently?')) return
    try {
      await deleteLead(id)
      toast.success('Lead deleted')
      setSelectedIds(p => p.filter(x => x !== id))
      if (detailId === id) setDetailId(null)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleSaveDetail = async () => {
    if (!detailId) return
    try {
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean)
      await updateLead(detailId, {
        notes: editNotes || null,
        tags,
        follow_up_date: editFollowUp || null,
      })
      toast.success('Lead updated')
      mutateDetail()
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ── Bulk actions ──
  const handleBulkStatus = async (status) => {
    setBulkMenuOpen(false)
    try {
      await bulkUpdateStatus(selectedIds, status)
      toast.success(`${selectedIds.length} leads → ${status}`)
      setSelectedIds([])
      setSelectAll(false)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleBulkDelete = async () => {
    setBulkMenuOpen(false)
    if (!confirm(`Delete ${selectedIds.length} leads permanently?`)) return
    try {
      await bulkDelete(selectedIds)
      toast.success(`${selectedIds.length} leads deleted`)
      setSelectedIds([])
      setSelectAll(false)
      if (selectedIds.includes(detailId)) setDetailId(null)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleBulkExport = async () => {
    setBulkMenuOpen(false)
    try {
      await exportLeads({ lead_ids: selectedIds })
      toast.success('Export downloaded')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleExportAll = async () => {
    try {
      await exportLeads({
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined,
        video_id: filters.video_id || undefined,
      })
      toast.success('Export downloaded')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importLeads(file)
      toast.success(
        `Imported: ${result.imported}, Updated: ${result.updated}, Skipped: ${result.skipped}`
      )
      setImportModalOpen(false)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Styles ──
  const card = { background: '#1A1F2E', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }
  const pill = (active) => ({
    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    background: active ? '#4F6EF7' : 'rgba(255,255,255,0.06)', color: active ? '#fff' : '#94A3B8',
    border: 'none', transition: 'all .15s',
  })
  const btn = (bg = '#4F6EF7') => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    background: bg, color: '#fff', border: 'none', cursor: 'pointer',
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1440, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0 }}>Leads</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
            {total} total lead{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btn('rgba(255,255,255,0.08)')} onClick={() => setImportModalOpen(true)}>
            ⬆ Import CSV
          </button>
          <button style={btn('rgba(255,255,255,0.08)')} onClick={handleExportAll}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div style={{ ...card, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Status pills */}
        {['all', ...STATUS_OPTIONS].map(s => (
          <button key={s} style={pill(filters.status === s)}
            onClick={() => setFilters(f => ({ ...f, status: s, page: 1 }))}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Search */}
        <input
          placeholder="Search name, email, phone…"
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 13, width: 240,
            outline: 'none',
          }}
        />

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={e => setFilters(f => ({ ...f, sort: e.target.value, page: 1 }))}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none',
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="score_high">Score ↑</option>
          <option value="score_low">Score ↓</option>
          <option value="name_az">Name A–Z</option>
          <option value="name_za">Name Z–A</option>
        </select>
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selectedIds.length > 0 && (
        <div style={{
          ...card, padding: '10px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(79,110,247,0.1)', borderColor: 'rgba(79,110,247,0.3)',
        }}>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>
            {selectedIds.length} selected
          </span>
          <div style={{ position: 'relative' }}>
            <button style={btn()} onClick={() => setBulkMenuOpen(p => !p)}>
              Bulk Actions ▾
            </button>
            {bulkMenuOpen && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, zIndex: 50,
                background: '#1E2536', borderRadius: 10, padding: 6,
                border: '1px solid rgba(255,255,255,0.1)', minWidth: 180,
                boxShadow: '0 8px 24px rgba(0,0,0,.4)',
              }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => handleBulkStatus(s)}
                    style={{
                      display: 'block', width: '100%', padding: '8px 14px', fontSize: 13,
                      background: 'transparent', color: '#E2E8F0', border: 'none',
                      textAlign: 'left', cursor: 'pointer', borderRadius: 6,
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    Set → {s}
                  </button>
                ))}
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />
                <button onClick={handleBulkExport}
                  style={{
                    display: 'block', width: '100%', padding: '8px 14px', fontSize: 13,
                    background: 'transparent', color: '#E2E8F0', border: 'none',
                    textAlign: 'left', cursor: 'pointer', borderRadius: 6,
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  ⬇ Export Selected
                </button>
                <button onClick={handleBulkDelete}
                  style={{
                    display: 'block', width: '100%', padding: '8px 14px', fontSize: 13,
                    background: 'transparent', color: '#FF6B6B', border: 'none',
                    textAlign: 'left', cursor: 'pointer', borderRadius: 6,
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,69,69,0.1)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  🗑 Delete Selected
                </button>
              </div>
            )}
          </div>
          <button style={{ ...btn('transparent'), color: '#94A3B8', fontSize: 12 }}
            onClick={() => { setSelectedIds([]); setSelectAll(false) }}>
            Clear
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {/* Header Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '44px 2fr 2fr 1fr 80px 1fr 100px 80px',
          padding: '12px 20px', fontSize: 12, fontWeight: 600, color: '#64748B',
          borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          <div>
            <input type="checkbox" checked={selectAll} onChange={toggleSelectAll}
              style={{ accentColor: '#4F6EF7', cursor: 'pointer' }} />
          </div>
          <div>Name</div>
          <div>Email</div>
          <div>Status</div>
          <div>Score</div>
          <div>Video</div>
          <div>Captured</div>
          <div></div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14 }}>
            Loading leads…
          </div>
        )}

        {/* Empty */}
        {!isLoading && leads.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#94A3B8' }}>No leads found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Leads will appear here when viewers submit gates on your videos.</div>
          </div>
        )}

        {/* Rows */}
        {leads.map(lead => (
          <div key={lead.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '44px 2fr 2fr 1fr 80px 1fr 100px 80px',
              padding: '14px 20px', fontSize: 13, color: '#E2E8F0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer', transition: 'background .1s',
              background: selectedIds.includes(lead.id) ? 'rgba(79,110,247,0.06)' : 'transparent',
            }}
            onMouseEnter={e => { if (!selectedIds.includes(lead.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            onMouseLeave={e => { if (!selectedIds.includes(lead.id)) e.currentTarget.style.background = 'transparent' }}
            onClick={() => setDetailId(lead.id)}
          >
            <div onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={selectedIds.includes(lead.id)}
                onChange={() => toggleCheck(lead.id)}
                style={{ accentColor: '#4F6EF7', cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                background: 'rgba(79,110,247,0.15)', color: '#4F6EF7', flexShrink: 0,
              }}>
                {initials(lead.name || lead.email)}
              </div>
              <span style={{ fontWeight: 500 }}>{lead.name || '—'}</span>
            </div>
            <div style={{ color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lead.email || '—'}
            </div>
            <div onClick={e => e.stopPropagation()}>
              <select
                value={lead.status}
                onChange={e => handleStatusChange(lead.id, e.target.value, lead.status)}
                style={{
                  background: `${STATUS_COLORS[lead.status]}22`,
                  color: STATUS_COLORS[lead.status],
                  border: `1px solid ${STATUS_COLORS[lead.status]}44`,
                  borderRadius: 6, padding: '3px 8px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', outline: 'none',
                }}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <span style={{
                color: scoreColor(lead.score), fontWeight: 700, fontSize: 14,
              }}>
                {lead.score}
              </span>
            </div>
            <div style={{ color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lead.videos?.title || '—'}
            </div>
            <div style={{ color: '#64748B', fontSize: 12 }}>
              {timeAgo(lead.created_at)}
            </div>
            <div onClick={e => e.stopPropagation()}>
              <button
                onClick={() => handleDeleteLead(lead.id)}
                style={{
                  background: 'transparent', border: 'none', color: '#64748B',
                  cursor: 'pointer', fontSize: 16, padding: '2px 6px', borderRadius: 4,
                }}
                title="Delete lead"
                onMouseEnter={e => e.target.style.color = '#FF6B6B'}
                onMouseLeave={e => e.target.style.color = '#64748B'}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 12, marginTop: 20,
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            style={{
              ...btn('rgba(255,255,255,0.08)'),
              opacity: page <= 1 ? 0.4 : 1,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Prev
          </button>
          <span style={{ color: '#94A3B8', fontSize: 13 }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            style={{
              ...btn('rgba(255,255,255,0.08)'),
              opacity: page >= totalPages ? 0.4 : 1,
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ─── DETAIL DRAWER ──────────────────────────────────────────────── */}
      {detailId && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDetailId(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
            }}
          />
          {/* Drawer */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 520,
            background: '#13172A', zIndex: 101, overflowY: 'auto',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '-8px 0 32px rgba(0,0,0,.4)',
          }}>
            {detailLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading…</div>
            ) : detailLead ? (
              <div style={{ padding: 28 }}>
                {/* Close */}
                <button
                  onClick={() => setDetailId(null)}
                  style={{
                    position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)',
                    border: 'none', color: '#94A3B8', fontSize: 18, width: 32, height: 32,
                    borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>

                {/* Avatar + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700,
                    background: 'rgba(79,110,247,0.15)', color: '#4F6EF7',
                  }}>
                    {initials(detailLead.name || detailLead.email)}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                      {detailLead.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>{detailLead.email || '—'}</div>
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24,
                }}>
                  {[
                    { label: 'Phone', value: detailLead.phone || '—' },
                    { label: 'Device', value: detailLead.device || '—' },
                    { label: 'Score', value: detailLead.score },
                    { label: 'Watch Depth', value: detailLead.watch_depth_pct ? `${detailLead.watch_depth_pct}%` : '—' },
                    { label: 'Source', value: detailLead.utm_source || detailLead.source || '—' },
                    { label: 'Campaign', value: detailLead.utm_campaign || '—' },
                    { label: 'IP', value: detailLead.ip_address || '—' },
                    { label: 'Captured', value: formatDate(detailLead.created_at) },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px',
                    }}>
                      <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 14, color: '#E2E8F0', fontWeight: 500, marginTop: 2 }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Video Watched */}
                {detailLead.videos && (
                  <div style={{
                    ...card, padding: 14, marginBottom: 20,
                  }}>
                    <div style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>
                      Video Watched
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {detailLead.videos.thumbnail_url && (
                        <img src={detailLead.videos.thumbnail_url} alt="" style={{
                          width: 80, height: 45, borderRadius: 6, objectFit: 'cover',
                        }} />
                      )}
                      <div>
                        <div style={{ fontSize: 14, color: '#E2E8F0', fontWeight: 600 }}>
                          {detailLead.videos.title}
                        </div>
                        {detailLead.watch_depth_pct !== null && (
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                            Watched {detailLead.watch_depth_pct}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Status
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {STATUS_OPTIONS.map(s => (
                      <button key={s}
                        onClick={() => handleStatusChange(detailLead.id, s, detailLead.status)}
                        style={{
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', border: `1px solid ${STATUS_COLORS[s]}44`,
                          background: detailLead.status === s ? `${STATUS_COLORS[s]}33` : 'transparent',
                          color: detailLead.status === s ? STATUS_COLORS[s] : '#64748B',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Survey Responses */}
                {detailLead.responses && detailLead.responses.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                      Survey Responses
                    </label>
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {detailLead.responses.map((r, i) => (
                        <div key={i} style={{
                          background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px',
                        }}>
                          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                            {r.question || r.label || `Question ${i + 1}`}
                          </div>
                          <div style={{ fontSize: 13, color: '#E2E8F0', marginTop: 2 }}>
                            {r.answer || r.value || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Tags <span style={{ fontWeight: 400, textTransform: 'none' }}>(comma-separated)</span>
                  </label>
                  <input
                    value={editTags}
                    onChange={e => setEditTags(e.target.value)}
                    placeholder="hot, demo-request, enterprise"
                    style={{
                      width: '100%', marginTop: 6, padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Follow-up Date */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={editFollowUp}
                    onChange={e => setEditFollowUp(e.target.value)}
                    style={{
                      width: '100%', marginTop: 6, padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    rows={4}
                    placeholder="Add internal notes about this lead…"
                    style={{
                      width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Save Button */}
                <button onClick={handleSaveDetail} style={btn()}>
                  💾 Save Changes
                </button>

                {/* ── Timeline / Events ── */}
                {detailLead.events && detailLead.events.length > 0 && (
                  <div style={{ marginTop: 28 }}>
                    <label style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                      Activity Timeline
                    </label>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {detailLead.events.map(ev => (
                        <div key={ev.id} style={{
                          display: 'flex', gap: 12, alignItems: 'flex-start',
                          padding: '10px 14px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.03)',
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                            background: ev.event_type === 'status_change' ? '#F5A623'
                              : ev.event_type === 'gate_submit' ? '#1ED8A0' : '#4F6EF7',
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500 }}>
                              {ev.event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </div>
                            {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                {ev.metadata.from && ev.metadata.to
                                  ? `${ev.metadata.from} → ${ev.metadata.to}`
                                  : JSON.stringify(ev.metadata)
                                }
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>
                              {formatDate(ev.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Lead not found</div>
            )}
          </div>
        </>
      )}

      {/* ─── IMPORT MODAL ───────────────────────────────────────────────── */}
      {importModalOpen && (
        <>
          <div
            onClick={() => setImportModalOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#1A1F2E', borderRadius: 16, padding: 32, zIndex: 201,
            width: 440, border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 16px 48px rgba(0,0,0,.5)',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
              Import Leads from CSV
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>
              Upload a CSV file with at least an <strong style={{ color: '#94A3B8' }}>email</strong> column.
              Supported columns: name, first_name, last_name, phone, status, tags, notes, score, source.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImport}
              style={{
                display: 'block', width: '100%', padding: '12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.15)',
                color: '#E2E8F0', fontSize: 13, cursor: 'pointer', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => setImportModalOpen(false)}
              style={{ ...btn('rgba(255,255,255,0.08)'), marginTop: 16, width: '100%' }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}