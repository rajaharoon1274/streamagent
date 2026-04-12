'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { MOCK_VIDEOS, INIT_ROUTES } from '@/lib/mockData'

// ── tiny sparkline ────────────────────────────────────────────────────────────
function Sparkline({ color }) {
  const pts = [40, 55, 45, 70, 60, 80, 72]
  const points = pts.map((v, i) =>
    `${i * 14},${40 - Math.round(v * 0.35)}`
  ).join(' ')
  return (
    <svg width={84} height={28} viewBox="0 0 84 28" fill="none" style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  )
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  const icons = {
    eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    play: <svg width="14" height="14" viewBox="0 0 24 24" fill={color}><polygon points="5,3 19,12 5,21" /></svg>,
    zap: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" /></svg>,
    branch: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M18 9a9 9 0 01-9 9" /></svg>,
  }
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{label}</div>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icons[icon]}
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.5px', marginBottom: 2 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{sub}</div>
        <Sparkline color={color} />
      </div>
    </div>
  )
}

// ── ring progress for goals ───────────────────────────────────────────────────
function RingChart({ pct, color }) {
  const r = 18, circ = 2 * Math.PI * r
  const dash = Math.round((pct / 100) * circ)
  return (
    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--b2)" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color }}>{pct}%</div>
    </div>
  )
}

// ── goals section ─────────────────────────────────────────────────────────────
function GoalsSection({ goals, setGoals }) {
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [newGoal, setNewGoal] = useState({ type: 'leads', target: '', period: 'month' })
  const [todayDate, setTodayDate] = useState(15)
  useEffect(() => { setTodayDate(new Date().getDate()) }, [])

  const GOAL_TYPES = {
    leads: { label: '⚡ Leads Captured', unit: '' },
    views: { label: '👁 Video Views', unit: '' },
    plays: { label: '▶ Video Plays', unit: '' },
    completion: { label: '🎯 Avg Watch Depth', unit: '%' },
    cta_clicks: { label: '🔗 CTA Clicks', unit: '' },
    videos: { label: '🎬 Videos Published', unit: '' },
  }

  function addGoal() {
    if (!newGoal.target) return
    const info = GOAL_TYPES[newGoal.type]
    const colors = ['#4F6EF7', '#1ED8A0', '#F5A623', '#A855F7', '#FF6B6B', '#06B6D4']
    setGoals(prev => [...prev, {
      id: Date.now(), label: info.label.replace(/^.+? /, ''),
      current: 0, target: +newGoal.target, unit: info.unit,
      period: newGoal.period, color: colors[prev.length % colors.length]
    }])
    setShowModal(false)
    setNewGoal({ type: 'leads', target: '', period: 'month' })
  }

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '16px 20px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Goals</div>
        </div>
        <button onClick={() => setShowModal(s => !s)}
          style={{ padding: '4px 12px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
          + Add Goal
        </button>
      </div>

      <div className="goals-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(goals.length, 3)}, 1fr)`, gap: 12 }}>
        {goals.map((g, gi) => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100))
          const onTrack = pct >= ((todayDate / 30) * 100) - 10
          const isEditing = editId === g.id
          return (
            <div key={g.id}
              onClick={() => setEditId(isEditing ? null : g.id)}
              style={{ background: 'var(--s3)', border: `1px solid ${isEditing ? 'var(--acc)' : 'var(--b2)'}`, borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden', cursor: isEditing ? 'default' : 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{g.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>This {g.period}</div>
                </div>
                <RingChart pct={pct} color={g.color} />
              </div>

              {isEditing ? (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    {['current', 'target'].map(k => (
                      <div key={k} style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--t3)', marginBottom: 2, textTransform: 'capitalize' }}>{k}</div>
                        <input type="number" defaultValue={g[k]}
                          onChange={e => {
                            const updated = [...goals]
                            updated[gi][k] = +e.target.value
                            setGoals(updated)
                          }}
                          style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 6, padding: '5px 8px', fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: 'inherit' }} />
                      </div>
                    ))}
                  </div>
                  <select defaultValue={g.period}
                    onChange={e => { const u = [...goals]; u[gi].period = e.target.value; setGoals(u) }}
                    style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: 'var(--t1)', fontFamily: 'inherit', marginBottom: 6 }}>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="quarter">Quarter</option>
                  </select>
                  <button onClick={e => { e.stopPropagation(); setEditId(null) }}
                    style={{ width: '100%', padding: 5, borderRadius: 6, background: 'var(--acc)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Done</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)' }}>{g.current.toLocaleString()}{g.unit || ''}</span>
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>/ {g.target.toLocaleString()}{g.unit || ''}</span>
                </div>
              )}

              <div style={{ height: 4, borderRadius: 2, background: 'var(--b2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: g.color, borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: onTrack ? 'var(--grn)' : 'var(--amb)' }}>
                  {onTrack ? '✓ On track' : '⚠ Behind pace'}
                </span>
                <button onClick={e => { e.stopPropagation(); setGoals(goals.filter((_, i) => i !== gi)) }}
                  style={{ fontSize: 9, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>New Goal</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <select value={newGoal.type} onChange={e => setNewGoal(p => ({ ...p, type: e.target.value }))}
              style={{ flex: 1, background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: 'var(--t1)', fontFamily: 'inherit' }}>
              {Object.entries(GOAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input type="number" placeholder="Target" value={newGoal.target}
              onChange={e => setNewGoal(p => ({ ...p, target: e.target.value }))}
              style={{ width: 80, background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: 'var(--t1)', fontFamily: 'inherit' }} />
            <select value={newGoal.period} onChange={e => setNewGoal(p => ({ ...p, period: e.target.value }))}
              style={{ width: 90, background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: 'var(--t1)', fontFamily: 'inherit' }}>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={addGoal} style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--acc)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Add Goal</button>
            <button onClick={() => setShowModal(false)} style={{ padding: '7px 12px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── constants (static — unchanged) ───────────────────────────────────────────
const HOT_LEADS = [
  { name: 'Sarah Chen', email: 'sarah@meridianfin.com', phone: '(310) 555-0192', score: 94, video: 'Platform Overview', watchPct: 92, action: 'Clicked Book a Call 2x', signal: '🔥 Ready to close', color: '#FF6B6B', suggestion: 'She watched 92% and hit the booking CTA twice without completing. A quick personal follow-up could close this.' },
  { name: 'Mike Torres', email: 'mike.t@remax.com', phone: '(424) 555-0847', score: 87, video: 'Refinance Guide', watchPct: 100, action: 'Rewatched 3x this week', signal: '🔄 In decision mode', color: '#F5A623', suggestion: 'Three rewatches signals serious interest but hesitation. Send a short personal video addressing common concerns.' },
  { name: 'Lisa Park', email: 'lisa@kwrealty.com', phone: '(818) 555-7741', score: 78, video: 'Lead Gen Training', watchPct: 85, action: 'Downloaded guide + shared link', signal: '⚡ High engagement', color: '#1ED8A0', suggestion: 'She is consuming content AND sharing it. This is a champion — offer her early access or a referral bonus.' },
]

const WEEKLY = [42, 67, 55, 80, 91, 74, 88]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const LIVE_ACTIVITY = [
  { icon: '🎯', color: '#1ED8A0', text: 'Lead captured', detail: 'mike.r@gmail.com · Lead Strategy', time: '2m' },
  { icon: '▶', color: '#4F6EF7', text: 'Video played', detail: 'Platform Overview · Chicago IL', time: '4m' },
  { icon: '📈', color: '#A855F7', text: '75% milestone', detail: 'Sales Presentation · Austin TX', time: '7m' },
  { icon: '🎯', color: '#1ED8A0', text: 'Lead captured', detail: 'sarah.m@gmail.com · Follow-Up', time: '12m' },
  { icon: '▶', color: '#06B6D4', text: 'Video played', detail: 'Conversion Masterclass · Denver CO', time: '18m' },
]

const TOP_SOURCES = [
  { title: 'Platform Overview', leads: 89, pct: 42 },
  { title: 'Lead Gen Guide', leads: 64, pct: 30 },
  { title: 'Follow-Up Sequence', leads: 38, pct: 18 },
]

const DEFAULT_GOALS = [
  { id: 'g1', label: 'Leads Captured', current: 212, target: 500, unit: '', period: 'month', color: '#1ED8A0' },
  { id: 'g2', label: 'Video Views', current: 6847, target: 10000, unit: '', period: 'month', color: '#4F6EF7' },
  { id: 'g3', label: 'Avg Watch Depth', current: 58, target: 70, unit: '%', period: 'month', color: '#F5A623' },
]

// ── main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { state, goto } = useApp()
  const [goals, setGoals] = useState(state.dashGoals || DEFAULT_GOALS)
  const [chartRange, setChartRange] = useState('7D')
  const [smsModal, setSmsModal] = useState(null)
  const [greeting, setGreeting] = useState('Good morning')

  // ── real API stats ─────────────────────────────────────────────────────────
  const [apiStats, setApiStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setApiStats(d) })
      .catch(() => { })
      .finally(() => setStatsLoading(false))
  }, [])

  // ── fallback to mock data when API hasn't loaded yet ──────────────────────
  const videos = MOCK_VIDEOS || []
  const topVideo = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0))[0]
  const totalCP = INIT_ROUTES.reduce((a, r) => a + (r.choicePoints?.length || 0), 0)
  const wmax = Math.max(...WEEKLY)

  // stat card values: real from API once loaded, mock until then
  const totalViews = apiStats ? apiStats.totalViews : videos.reduce((a, v) => a + (v.views || 0), 0)
  const totalPlays = apiStats ? apiStats.totalPlays : videos.reduce((a, v) => a + (v.plays || 0), 0)
  const totalLeads = apiStats ? apiStats.totalLeads : 212
  const totalVideos = apiStats ? apiStats.totalVideos : videos.length

  // lead capture progress — real if available, else mock
  const leadLimit = 500
  const leadPct = Math.min(100, Math.round((totalLeads / leadLimit) * 100))
  const leadRemain = Math.max(0, leadLimit - totalLeads)

  return (
    <div style={{ padding: '22px', maxWidth: 1400, animation: 'fadeIn 0.18s ease' }} className="dash-padding">

      <style jsx global>{`
        @media (max-width: 900px) {
          .goals-grid       { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-stats       { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-hot-leads   { grid-template-columns: 1fr !important; }
          .dash-padding     { padding: 16px !important; }
          .dash-greeting    { font-size: 18px !important; }
          .dash-main        { grid-template-columns: 1fr !important; }
          .dash-bottom      { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .goals-grid { grid-template-columns: repeat(2, 1fr) !important; overflow-x: auto; }
        }
      `}</style>

      {/* ── Greeting ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div className="dash-greeting" style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', marginBottom: 3 }}>
            {greeting}, {state.account?.firstName} 👋
          </div>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>Here's how your videos are performing today.</div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        <StatCard
          label="Total Views"
          value={statsLoading ? '—' : totalViews.toLocaleString()}
          sub={apiStats ? 'All time' : '+12% this week'}
          color="#4F6EF7" icon="eye"
        />
        <StatCard
          label="Total Plays"
          value={statsLoading ? '—' : totalPlays.toLocaleString()}
          sub={apiStats ? 'All time' : '+8% this week'}
          color="#06B6D4" icon="play"
        />
        <StatCard
          label="Leads Captured"
          value={statsLoading ? '—' : totalLeads.toLocaleString()}
          sub={`${totalLeads} of ${leadLimit} this month`}
          color="#1ED8A0" icon="zap"
        />
        <StatCard
          label="Total Videos"
          value={statsLoading ? '—' : totalVideos.toLocaleString()}
          sub={`${totalCP} active choice points`}
          color="#F5A623" icon="branch"
        />
      </div>

      {/* ── Goals ── */}
      <GoalsSection goals={goals} setGoals={setGoals} />

      {/* ── Hot Leads Briefing ── */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '16px 20px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>This Week's Hot Leads</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>Based on watch behavior and engagement signals</div>
            </div>
          </div>
          <button onClick={() => goto('leads')}
            style={{ padding: '4px 12px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            View All Leads →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }} className="dash-hot-leads">
          {HOT_LEADS.map((lead, li) => {
            const sc = lead.score >= 85 ? '#1ED8A0' : lead.score >= 70 ? '#F5A623' : '#FF6B6B'
            return (
              <div key={li} style={{ background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 11, padding: 14, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: lead.color }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${lead.color}33`, border: `1.5px solid ${lead.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: lead.color }}>
                      {lead.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{lead.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--t3)' }}>{lead.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: sc }}>{lead.score}</div>
                    <div style={{ fontSize: 8, color: 'var(--t3)' }}>Score</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--t2)', marginBottom: 6 }}>
                  <span style={{ color: 'var(--t3)' }}>Watched:</span> <strong>{lead.video}</strong> · {lead.watchPct}%
                </div>
                <div style={{ fontSize: 10, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: lead.color }}>{lead.signal}</span> · {lead.action}
                </div>
                <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--acc)', marginBottom: 3 }}>💡 Suggested Action</div>
                  <div style={{ fontSize: 10, color: 'var(--t2)', lineHeight: 1.5 }}>{lead.suggestion}</div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button style={{ flex: 1, padding: 6, borderRadius: 7, background: 'var(--acc)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>📧 Email</button>
                  <button onClick={e => { e.stopPropagation(); setSmsModal({ name: lead.name, phone: lead.phone, video: lead.video, email: lead.email }) }}
                    style={{ flex: 1, padding: 6, borderRadius: 7, background: 'linear-gradient(135deg,#10B981,#06B6D4)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>📲 Text Video</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Main Grid: chart + live activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, marginBottom: 14 }} className="dash-main">

        {/* Weekly Engagement Chart */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Weekly Engagement</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['7D', '30D', '90D'].map(l => (
                <button key={l} onClick={() => setChartRange(l)}
                  style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, border: `1px solid ${l === chartRange ? 'var(--acc)' : 'var(--b2)'}`, background: l === chartRange ? 'rgba(79,110,247,0.1)' : 'transparent', color: l === chartRange ? 'var(--acc)' : 'var(--t3)', cursor: 'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, marginBottom: 8 }}>
            {WEEKLY.map((val, i) => {
              const h = Math.round((val / wmax) * 100)
              const isToday = i === 6
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600 }}>{val}</div>
                  <div style={{ width: '100%', background: isToday ? 'var(--acc)' : 'rgba(79,110,247,0.3)', borderRadius: '5px 5px 0 0', height: `${h}%`, transition: 'height 0.3s', cursor: 'pointer' }}
                    title={`${val} plays`}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--acc)'}
                    onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'rgba(79,110,247,0.3)' }} />
                  <div style={{ fontSize: 9, color: isToday ? 'var(--acc)' : 'var(--t3)', fontWeight: isToday ? 700 : 400 }}>{DAYS[i]}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid var(--b1)' }}>
            <div><div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>Avg Daily Plays</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>71</div></div>
            <div><div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>Best Day</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--grn)' }}>Friday · 91</div></div>
            <div><div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>This Week</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--acc)' }}>497 plays</div></div>
          </div>
        </div>

        {/* Live Activity */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1ED8A0', animation: 'saPulse 2s infinite' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Live Activity</div>
          </div>
          {LIVE_ACTIVITY.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < LIVE_ACTIVITY.length - 1 ? '1px solid var(--b1)' : 'none' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${e.color}18`, border: `1px solid ${e.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                {e.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)' }}>{e.text}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.detail}</div>
              </div>
              <div style={{ fontSize: 9, color: 'var(--t3)', flexShrink: 0 }}>{e.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Grid: top video + lead capture + streamroutes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }} className="dash-bottom">

        {/* Top Video */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>🏆 Top Video</div>
            <button onClick={() => goto('library')} style={{ fontSize: 11, color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>All videos →</button>
          </div>
          {topVideo && (() => {
            const isVert = topVideo.aspectRatio === '9:16'
            const isSq = topVideo.aspectRatio === '1:1'
            const ar = isVert ? '9/16' : isSq ? '1/1' : '16/9'
            return (
              <div onClick={() => goto('library')} style={{ cursor: 'pointer' }}>
                <div style={{ width: '100%', aspectRatio: ar, maxWidth: isVert ? 280 : '100%', marginLeft: isVert ? 'auto' : undefined, marginRight: isVert ? 'auto' : undefined, borderRadius: 10, background: topVideo.color || 'linear-gradient(135deg,#1E2540,#0F172A)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', borderRadius: 10 }} />
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={topVideo.color || '#4F6EF7'}><polygon points="5,3 19,12 5,21" /></svg>
                  </div>
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--grn)', color: '#071a14', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 100 }}>#1</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>{topVideo.title}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div><div style={{ fontSize: 9, color: 'var(--t3)' }}>VIEWS</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{(topVideo.views || 0).toLocaleString()}</div></div>
                  <div><div style={{ fontSize: 9, color: 'var(--t3)' }}>ENGAGEMENT</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--grn)' }}>{topVideo.eng || 0}%</div></div>
                  <div><div style={{ fontSize: 9, color: 'var(--t3)' }}>DURATION</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{topVideo.dur || '—'}</div></div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Lead Capture */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>🎯 Lead Capture</div>
            <button onClick={() => goto('leads')} style={{ fontSize: 11, color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View leads →</button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--t2)' }}>Monthly usage</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{statsLoading ? '…' : `${totalLeads} / ${leadLimit}`}</div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--s3)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${leadPct}%`, background: 'linear-gradient(90deg,var(--acc),#A855F7)', borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>
              {statsLoading ? '…' : `${leadRemain} leads remaining this month`}
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Top Sources</div>
          {TOP_SOURCES.map(s => (
            <div key={s.title} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ fontSize: 11, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{s.title}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)', flexShrink: 0 }}>{s.leads}</div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--s3)' }}>
                <div style={{ height: '100%', width: `${s.pct}%`, background: 'var(--grn)', borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

        {/* StreamRoutes */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>⚡ StreamRoutes</div>
            <button onClick={() => goto('builder')} style={{ fontSize: 11, color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Open builder →</button>
          </div>
          {(state.streamRoutes || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🛤</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12 }}>No StreamRoutes yet</div>
              <button onClick={() => goto('builder')} style={{ padding: '8px 16px', borderRadius: 9, background: 'var(--acc)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>+ Create First Route</button>
            </div>
          ) : (
            (state.streamRoutes || []).slice(0, 4).map(sr => (
              <div key={sr.id} onClick={() => goto('builder')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b1)', marginBottom: 7, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--acc)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b1)'}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(79,110,247,0.12)', border: '1px solid rgba(79,110,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📁</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sr.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>{(sr.videos || []).length} videos · {sr.connections || 0} connections</div>
                </div>
                <div style={{ fontSize: 9, color: 'var(--t3)', flexShrink: 0 }}>{sr.created}</div>
              </div>
            ))
          )}
          <button onClick={() => goto('builder')}
            style={{ width: '100%', padding: 8, borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
            + New Route
          </button>
        </div>

      </div>

      {/* ── SMS Modal ── */}
      {smsModal && <SmsModal modal={smsModal} videos={videos} onClose={() => setSmsModal(null)} />}
    </div>
  )
}

// ── SMS Modal ─────────────────────────────────────────────────────────────────
function SmsModal({ modal, videos, onClose }) {
  const firstName = modal.name ? modal.name.split(' ')[0] : ''
  const selectedVid = videos.find(v => v.title === modal.video) || videos[0]
  const [phone, setPhone] = useState(modal.phone || '')
  const [videoId, setVideoId] = useState(selectedVid?.id || 1)
  const [msg, setMsg] = useState(
    `Hey ${firstName}, I put together a quick video for you. Check it out here: https://stream.agent/v/${selectedVid?.id || 1}?name=${encodeURIComponent(firstName)}`
  )
  const [sent, setSent] = useState(false)

  function handleVideoChange(e) {
    const newId = e.target.value
    setVideoId(newId)
    const newUrl = `https://stream.agent/v/${newId}?name=${encodeURIComponent(firstName)}`
    setMsg(prev => {
      const old = prev.match(/https:\/\/stream\.agent\/v\/\S+/)
      return old ? prev.replace(old[0], newUrl) : prev + '\n' + newUrl
    })
  }

  function handleSend() {
    setSent(true)
    setTimeout(() => onClose(), 1500)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--s1)', border: '1px solid var(--b2)', borderRadius: 16, width: 400, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📲</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Text Video to {modal.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Phone Number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-0000"
            style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--t1)', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box' }} />

          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Video</label>
          <select value={videoId} onChange={handleVideoChange}
            style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--t1)', fontFamily: 'inherit', cursor: 'pointer', marginBottom: 12 }}>
            {videos.map(vid => (
              <option key={vid.id} value={vid.id}>{vid.title} ({vid.dur})</option>
            ))}
          </select>

          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Message</label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)}
            style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--t1)', fontFamily: 'inherit', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', outline: 'none' }} />
          <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 6, marginBottom: 14, lineHeight: 1.4 }}>🔗 Video link auto-includes personalization. Sent via Twilio.</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSend} disabled={sent}
              style={{ flex: 1, padding: 10, borderRadius: 9, background: 'linear-gradient(135deg,#10B981,#06B6D4)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: sent ? 0.7 : 1 }}>
              {sent ? '✓ Sent!' : '📲 Send Text'}
            </button>
            <button onClick={onClose}
              style={{ padding: '10px 16px', borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}