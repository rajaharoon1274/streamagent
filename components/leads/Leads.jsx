'use client'
import { useState, useMemo } from 'react'
import Icon from '@/components/ui/Icon'
import { LEADS, VIDEOS } from '@/lib/mockData'

/* ── Status colours (matches HTML buildLeads) ─────────────────────────────── */
const ST = { New: '#4F6EF7', Contacted: '#F5A623', Qualified: '#1ED8A0', Closed: '#06B6D4' }

function heatTag(pct) {
  if (pct >= 80) return { label: 'Hot', color: '#FF6B6B' }
  if (pct >= 50) return { label: 'Warm', color: '#F5A623' }
  return { label: 'Cold', color: '#06B6D4' }
}
function scoreColor(sc) { return sc >= 80 ? '#1ED8A0' : sc >= 60 ? '#F5A623' : '#FF6B6B' }
function initials(n) { return n.split(' ').map(w => w[0]).join('').slice(0, 2) }
function shortDate(d) { return d.replace(' ago', '').replace('hours', 'h').replace('hour', 'h').replace('days', 'd').replace('day', 'd') }

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Leads() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [smsModal, setSmsModal] = useState(null)
  const [importModal, setImportModal] = useState(false)

  /* export CSV helper */
  const exportLeadsCSV = (ids) => {
    const rows = ids ? LEADS.filter(l => ids.includes(l.id)) : LEADS
    const headers = ['Name','Email','Phone','Video','Status','Score','Watch %','Source','Campaign','Date']
    let csv = headers.join(',') + '\n'
    rows.forEach(l => {
      csv += [l.name, l.email, l.phone, l.video, l.status, l.score, l.watchPct + '%', l.source, l.campaign, l.date]
        .map(v => { const s = String(v || ''); return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s })
        .join(',') + '\n'
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `streamagent-leads-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /* stats */
  const hotCount = LEADS.filter(l => l.watchPct >= 80 && l.status !== 'Closed').length
  const avgScore = Math.round(LEADS.reduce((a, l) => a + l.score, 0) / LEADS.length)
  const closedCount = LEADS.filter(l => l.status === 'Closed').length

  /* filter + sort */
  const sorted = useMemo(() => {
    const out = LEADS.filter(l => {
      if (filter !== 'all' && l.status !== filter) return false
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.email.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    return [...out].sort((a, b) => {
      if (sort === 'score') return b.score - a.score
      if (sort === 'watch') return b.watchPct - a.watchPct
      if (sort === 'followup') {
        if (!a.followUp && !b.followUp) return 0
        if (!a.followUp) return 1
        if (!b.followUp) return -1
        return new Date(a.followUp) - new Date(b.followUp)
      }
      return 0
    })
  }, [filter, search, sort])

  const sel = selectedLead ? LEADS.find(l => l.id === selectedLead) : null

  const toggleCheck = id => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const handleRow = lead => {
    if (selectMode) { toggleCheck(lead.id) } else { setSelectedLead(selectedLead === lead.id ? null : lead.id) }
  }

  /* grid columns */
  const cols = selectMode ? '24px 32px 1fr 120px 70px 70px 50px' : '32px 1fr 120px 70px 70px 50px'

  return (
    <div className="leads-wrap" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      <style jsx global>{`
        @media (max-width: 900px) {
          .leads-table-wrapper {
            overflow-x: auto !important;
          }
          .leads-row {
            min-width: 800px;
          }
          .leads-table-header {
            min-width: 800px;
          }
        }
      `}</style>

      {/* ═══ Left: list ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ padding: '16px 20px 0', flexShrink: 0, background: 'var(--s1)' }}>

          {/* ── stat bar ── */}
          <div className="leads-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'TOTAL LEADS', value: LEADS.length, sub: 'This month', color: '#4F6EF7' },
              { label: 'HOT LEADS', value: hotCount, sub: '80%+ watch depth', color: '#FF6B6B' },
              { label: 'AVG SCORE', value: avgScore, sub: 'Across all leads', color: '#1ED8A0' },
              { label: 'CLOSED', value: closedCount, sub: `${Math.round(closedCount / LEADS.length * 100)}% close rate`, color: '#06B6D4' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── toolbar ── */}
          <div className="leads-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 9, padding: '7px 12px' }}>
              <Icon name="search" size={13} color="var(--t3)" />
              <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 12, color: 'var(--t1)', width: '100%', outline: 'none' }} />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '7px 12px', borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 11, cursor: 'pointer' }}>
              <option value="newest">Newest</option>
              <option value="score">Score</option>
              <option value="watch">Watch %</option>
              <option value="followup">Follow-up</option>
            </select>
            <button onClick={() => setImportModal(true)} className="hide-mobile" style={{ padding: '7px 13px', borderRadius: 9, background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.25)', color: 'var(--acc)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Import</button>
            <button onClick={() => exportLeadsCSV()} className="hide-mobile" style={{ padding: '7px 13px', borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Export</button>
            <button onClick={() => { setSelectMode(!selectMode); if (selectMode) setSelectedIds([]) }} style={{ padding: '7px 13px', borderRadius: 9, background: selectMode ? 'rgba(79,110,247,0.12)' : 'var(--s3)', border: `1px solid ${selectMode ? 'var(--acc)' : 'var(--b2)'}`, color: selectMode ? 'var(--acc)' : 'var(--t2)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {selectMode ? '✓ Selecting' : 'Select'}
            </button>
          </div>

          {/* ── bulk-action bar (select mode) ── */}
          {selectMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 12px', background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 9 }}>
              <button onClick={() => setSelectedIds(selectedIds.length === sorted.length ? [] : sorted.map(l => l.id))} style={{ padding: '5px 10px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                {selectedIds.length === sorted.length ? 'Deselect All' : 'Select All'}
              </button>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--acc)', flex: 1 }}>{selectedIds.length} selected</span>
              {selectedIds.length > 0 && (
                <>
                  <button onClick={() => exportLeadsCSV(selectedIds)} style={{ padding: '5px 12px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Export CSV</button>
                  <button onClick={() => { setSelectedIds([]); setSelectMode(false) }} style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: 'var(--red)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                </>
              )}
            </div>
          )}

          {/* ── filter tabs ── */}
          <div className="leads-filters" style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
            {['all', 'New', 'Contacted', 'Qualified', 'Closed'].map(f => {
              const count = f === 'all' ? LEADS.length : LEADS.filter(l => l.status === f).length
              const active = filter === f
              const c = f === 'all' ? '#4F6EF7' : ST[f]
              return (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: active ? 700 : 500, cursor: 'pointer', background: active ? `${c}18` : 'transparent', color: active ? c : 'var(--t3)', border: `1px solid ${active ? `${c}44` : 'transparent'}`, transition: 'all 0.15s' }}>
                  {f === 'all' ? 'All' : f} <span style={{ opacity: 0.6 }}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── table ── */}
        <div className="leads-table-wrapper" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
          {/* header */}
          <div className="leads-table-header" style={{ display: 'grid', gridTemplateColumns: cols, gap: 10, alignItems: 'center', padding: '8px 12px', fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--b1)' }}>
            {selectMode && <div />}
            <div /><div>Lead</div><div className="hide-mobile">Video</div><div className="hide-mobile">Watch</div><div>Score</div><div />
          </div>

          {sorted.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>No leads match your filters</div>}

          {/* rows */}
          {sorted.map(lead => {
            const isSel = selectedLead === lead.id
            const sc = lead.score
            const scCol = scoreColor(sc)
            const ht = heatTag(lead.watchPct)
            const stColor = ST[lead.status]
            const isChecked = selectedIds.includes(lead.id)

            return (
              <div key={lead.id} onClick={() => handleRow(lead)} className="leads-row" style={{ display: 'grid', gridTemplateColumns: cols, gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 10, marginTop: 4, cursor: 'pointer', background: isSel ? 'rgba(79,110,247,0.08)' : 'transparent', border: `1px solid ${isSel ? 'var(--acc)' : 'transparent'}`, transition: 'all 0.12s' }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--s2)' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
              >
                {selectMode && (
                  <div onClick={e => { e.stopPropagation(); toggleCheck(lead.id) }} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isChecked ? 'var(--acc)' : 'var(--b2)'}`, background: isChecked ? 'var(--acc)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    {isChecked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
                  </div>
                )}

                {/* avatar */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${stColor}18`, border: `1.5px solid ${stColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: stColor }}>{initials(lead.name)}</div>

                {/* name + badge + email */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 100, background: `${stColor}18`, color: stColor, flexShrink: 0 }}>{lead.status}</span>
                    {lead.rewatched && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 100, background: 'rgba(168,85,247,0.1)', color: '#A855F7', flexShrink: 0 }}>Re-watch</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.email}{lead.source ? ` · ${lead.source}` : ''}</div>
                </div>

                {/* video */}
                <div className="hide-mobile" style={{ fontSize: 10, color: 'var(--t2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.video}</div>

                {/* watch */}
                <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--s4)', overflow: 'hidden' }}>
                    <div style={{ width: `${lead.watchPct}%`, height: '100%', background: ht.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: ht.color }}>{lead.watchPct}%</span>
                </div>

                {/* score */}
                <div style={{ fontSize: 14, fontWeight: 800, color: scCol }}>{sc}</div>

                {/* date */}
                <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'right' }}>{shortDate(lead.date)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ Right: detail panel ═══ */}
      <div className="leads-detail-panel" style={{ width: 360, borderLeft: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', background: 'var(--s1)' }}>
        {!sel ? <EmptyDetail /> : <LeadDetail key={sel.id} lead={sel} onTextVideo={l => setSmsModal({ name: l.name, phone: l.phone, video: l.video })} />}
      </div>

      {/* ═══ SMS modal ═══ */}
      {smsModal && <SmsModal data={smsModal} onClose={() => setSmsModal(null)} />}

      {/* ═══ Import CSV modal ═══ */}
      {importModal && <ImportCSVModal onClose={() => setImportModal(false)} />}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Empty state */
/* ══════════════════════════════════════════════════════════════════════════ */
function EmptyDetail() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', marginBottom: 4 }}>Select a lead</div>
      <div style={{ fontSize: 11, color: 'var(--t3)' }}>Click any lead to view their full profile, video activity, and timeline</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Lead detail panel */
/* ══════════════════════════════════════════════════════════════════════════ */
function LeadDetail({ lead, onTextVideo }) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [saved, setSaved] = useState(false)
  const stColor = ST[lead.status]
  const scCol = scoreColor(lead.score)
  const ht = heatTag(lead.watchPct)
  const isOverdue = lead.followUp && new Date(lead.followUp) < new Date()

  const timeline = [
    { icon: '⚡', label: 'Email captured', detail: `Submitted at ${lead.watchPct}% watch depth`, time: lead.date, color: '#FF6B6B' },
    { icon: '⑂', label: `Branch: ${lead.branch}`, detail: `${lead.branch} path selected`, time: lead.date, color: '#A855F7' },
    { icon: '▶', label: 'Video started', detail: lead.video, time: lead.date, color: '#4F6EF7' },
    ...(lead.rewatched ? [{ icon: '🔁', label: 'Re-watched', detail: 'Returned for second view', time: '1 day ago', color: '#A855F7' }] : []),
  ]

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 1500) }

  return (
    <>
      {/* ── header ── */}
      <div style={{ padding: 20, background: `linear-gradient(180deg, ${stColor}08 0%, transparent 100%)`, borderBottom: '1px solid var(--b1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${stColor}22`, border: `2px solid ${stColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: stColor }}>{initials(lead.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>{lead.name}</div>
            <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 1 }}>{lead.email}</div>
            {lead.phone && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{lead.phone}</div>}
          </div>
        </div>

        {/* status + score */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <select defaultValue={lead.status} style={{ flex: 1, padding: '8px 12px', borderRadius: 9, background: `${stColor}15`, border: `1px solid ${stColor}44`, color: stColor, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {['New', 'Contacted', 'Qualified', 'Closed'].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderRadius: 9, background: 'var(--s2)', border: '1px solid var(--b2)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `conic-gradient(${scCol} ${lead.score * 3.6}deg, var(--s4) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: scCol }}>{lead.score}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)' }}>Score</span>
          </div>
        </div>

        {/* action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button style={{ padding: 9, borderRadius: 9, background: 'var(--acc)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>✉️ Email</button>
          {lead.phone ? (
            <button onClick={() => onTextVideo(lead)} style={{ padding: 9, borderRadius: 9, background: 'linear-gradient(135deg,#10B981,#06B6D4)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>📲 Text Video</button>
          ) : (
            <button disabled style={{ padding: 9, borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t3)', fontSize: 11, fontWeight: 600, opacity: 0.5, cursor: 'default' }}>📲 No Phone</button>
          )}
        </div>
      </div>

      {/* ── scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* video activity */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Video Activity</div>
          <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 11, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{lead.video}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--acc)' }}>{lead.branch}</span>
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--t3)' }}>Watch depth</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: ht.color }}>{lead.watchPct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--s4)', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${lead.watchPct}%`, background: `linear-gradient(90deg,${ht.color}88,${ht.color})`, borderRadius: 3 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10 }}>
                <div style={{ padding: '6px 8px', background: 'var(--s3)', borderRadius: 7 }}>
                  <span style={{ color: 'var(--t3)' }}>Source</span><br />
                  <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{lead.source || 'Direct'}</span>
                </div>
                <div style={{ padding: '6px 8px', background: 'var(--s3)', borderRadius: 7 }}>
                  <span style={{ color: 'var(--t3)' }}>{lead.campaign ? 'Campaign' : 'Captured'}</span><br />
                  <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{lead.campaign || lead.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* follow-up */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Follow-up</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="date" defaultValue={lead.followUp || ''} style={{ flex: 1, padding: '8px 10px', borderRadius: 9, background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 11, cursor: 'pointer' }} />
            {lead.followUp && (
              <div style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: isOverdue ? 'rgba(255,107,107,0.1)' : 'rgba(245,166,35,0.1)', color: isOverdue ? '#FF6B6B' : '#F5A623', border: `1px solid ${isOverdue ? 'rgba(255,107,107,0.2)' : 'rgba(245,166,35,0.2)'}` }}>
                {isOverdue ? 'Overdue' : 'Upcoming'}
              </div>
            )}
          </div>
        </div>

        {/* timeline */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Timeline</div>
          {timeline.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: `${a.color}15`, border: `1px solid ${a.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>{a.icon}</div>
                {i < timeline.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--b1)', margin: '3px 0', minHeight: 16 }} />}
              </div>
              <div style={{ paddingBottom: i < timeline.length - 1 ? 12 : 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)' }}>{a.label}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{a.detail}</div>
                <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2, opacity: 0.6 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* notes */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this lead…" style={{ width: '100%', height: 80, padding: '10px 12px', borderRadius: 9, background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 11, resize: 'none', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={handleSave} style={{ width: '100%', padding: 9, borderRadius: 9, background: saved ? 'var(--grn)' : 'var(--acc)', color: saved ? '#071a14' : '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 6 }}>
            {saved ? '✓ Saved' : 'Save Note'}
          </button>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* SMS modal (matches buildSmsModal) */
/* ══════════════════════════════════════════════════════════════════════════ */
function SmsModal({ data, onClose }) {
  const firstName = data.name ? data.name.split(' ')[0] : ''
  const selVid = VIDEOS.find(v => v.title === data.video) || VIDEOS[0]
  const defaultUrl = `https://stream.agent/v/${selVid.id}?name=${encodeURIComponent(firstName)}`

  const [phone, setPhone] = useState(data.phone || '')
  const [message, setMessage] = useState(`Hey ${firstName}, I put together a quick video for you. Check it out here: ${defaultUrl}`)
  const [sent, setSent] = useState(false)

  const handleVideoChange = e => {
    const url = e.target.value
    setMessage(prev => {
      const m = prev.match(/https:\/\/stream\.agent\/v\/\S+/)
      return m ? prev.replace(m[0], url) : prev + '\n' + url
    })
  }

  const handleSend = () => { setSent(true); setTimeout(onClose, 1500) }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--s1)', border: '1px solid var(--b2)', borderRadius: 16, width: 400, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>📲</span><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Text Video to {data.name}</div></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Phone Number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-0000" style={{ width: '100%', marginBottom: 12, fontSize: 13, padding: '10px 12px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)', outline: 'none', boxSizing: 'border-box' }} />

          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Video</label>
          <select defaultValue={defaultUrl} onChange={handleVideoChange} style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--t1)', cursor: 'pointer', marginBottom: 12 }}>
            {VIDEOS.map(vid => {
              const url = `https://stream.agent/v/${vid.id}?name=${encodeURIComponent(firstName)}`
              return <option key={vid.id} value={url}>{vid.title} ({vid.dur})</option>
            })}
          </select>

          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--t1)', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', outline: 'none' }} />
          <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 6, marginBottom: 14, lineHeight: 1.4 }}>🔗 Video link auto-includes personalization. Sent via Twilio.</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSend} style={{ flex: 1, padding: 10, borderRadius: 9, background: 'linear-gradient(135deg,#10B981,#06B6D4)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{sent ? '✓ Sent!' : '📲 Send Text'}</button>
            <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Import CSV modal (matches openImportCSVModal) */
/* ══════════════════════════════════════════════════════════════════════════ */
function ImportCSVModal({ onClose }) {
  const [dragOver, setDragOver] = useState(false)
  const [parsedRows, setParsedRows] = useState(null)
  const [headers, setHeaders] = useState([])
  const [colMap, setColMap] = useState({ name: '', email: '', phone: '', source: '' })
  const [toast, setToast] = useState(null)
  const fileRef = { current: null }

  const FIELDS = [
    { key: 'name', label: 'Name', auto: ['name', 'full name', 'full_name', 'contact', 'first name'] },
    { key: 'email', label: 'Email', auto: ['email', 'email address', 'email_address', 'e-mail'] },
    { key: 'phone', label: 'Phone', auto: ['phone', 'phone number', 'mobile', 'cell'] },
    { key: 'source', label: 'Source', auto: ['source', 'channel', 'utm_source', 'lead source'] },
  ]

  const parseFile = file => {
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target.result
      const sep = text.indexOf('\t') > -1 && text.indexOf(',') === -1 ? '\t' : ','
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) return
      const hdrs = lines[0].split(sep).map(h => h.replace(/^["']|["']$/g, '').trim())
      const rows = []
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(sep).map(v => v.replace(/^["']|["']$/g, '').trim())
        const row = {}
        hdrs.forEach((h, j) => { row[h] = vals[j] || '' })
        rows.push(row)
      }
      setHeaders(hdrs)
      setParsedRows(rows)
      /* auto-map columns */
      const map = { name: '', email: '', phone: '', source: '' }
      FIELDS.forEach(f => {
        hdrs.forEach(h => { if (f.auto.includes(h.toLowerCase())) map[f.key] = h })
      })
      setColMap(map)
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (!parsedRows || !colMap.email) return
    let imported = 0
    parsedRows.forEach(row => {
      const email = colMap.email ? row[colMap.email] : ''
      if (!email) return
      const name = colMap.name ? row[colMap.name] : ''
      if (LEADS.some(l => l.email.toLowerCase() === email.toLowerCase())) return
      LEADS.push({
        id: LEADS.length + 100, name: name || email.split('@')[0], email,
        phone: colMap.phone ? row[colMap.phone] : '',
        video: 'Imported', status: 'New', tags: ['CSV Import'], score: 0, watchPct: 0,
        source: colMap.source ? row[colMap.source] : 'CSV Import',
        campaign: '', date: 'Just now', branch: '', notes: '', followUp: null, rewatched: false,
      })
      imported++
    })
    setToast(`${imported} lead${imported !== 1 ? 's' : ''} imported`)
    setTimeout(onClose, 1800)
  }

  const hasEmail = !!colMap.email

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--s1)', border: '1px solid var(--b2)', borderRadius: 18, padding: 28, maxWidth: 520, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(79,110,247,0.12)', border: '1px solid rgba(79,110,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📁</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>Import Leads from CSV</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Upload a .csv file with your lead database</div>
          </div>
        </div>

        {/* drop zone (hidden after parse) */}
        {!parsedRows && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) parseFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${dragOver ? 'var(--acc)' : 'var(--b2)'}`, borderRadius: 12, padding: '32px 20px', textAlign: 'center', marginBottom: 16, cursor: 'pointer', transition: 'border-color 0.15s' }}
          >
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>📄</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', marginBottom: 4 }}>Drop your CSV file here</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>or <span style={{ color: 'var(--acc)', textDecoration: 'underline', cursor: 'pointer' }}>browse to select</span></div>
            <input ref={el => fileRef.current = el} type="file" accept=".csv,.tsv,.txt" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) parseFile(e.target.files[0]) }} />
          </div>
        )}

        {/* preview + column mapping */}
        {parsedRows && (
          <>
            {/* preview table */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>{parsedRows.length} leads found</div>
              <div style={{ maxHeight: 100, overflowY: 'auto', border: '1px solid var(--b2)', borderRadius: 8, fontSize: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{headers.map(h => <th key={h} style={{ padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid var(--b1)', fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 3).map((row, i) => (
                      <tr key={i}>{headers.map(h => <td key={h} style={{ padding: '3px 8px', borderBottom: '1px solid var(--b1)', color: 'var(--t2)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{(row[h] || '').substring(0, 30)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* column mapping */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>Map columns</div>
              {FIELDS.map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', width: 80 }}>{f.label}</span>
                  <select value={colMap[f.key]} onChange={e => setColMap(p => ({ ...p, [f.key]: e.target.value }))} style={{ flex: 1, padding: '5px 8px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 11 }}>
                    <option value="">-- skip --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        {/* actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleImport} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'var(--acc)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: hasEmail && parsedRows ? 1 : 0.4, pointerEvents: hasEmail && parsedRows ? 'auto' : 'none' }}>Import Leads</button>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: 10, background: '#1ED8A0', color: '#fff', fontSize: 13, fontWeight: 700, zIndex: 99999, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>{toast}</div>
      )}
    </div>
  )
}