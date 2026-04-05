'use client'
import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import SparklineChart from '@/components/ui/SparklineChart'
import { VIDEOS, HEATMAP } from '@/lib/mockData'

/* ── static data ───────────────────────────────────────────── */
const GEO_DATA = [
  { country: 'United States', flag: '🇺🇸', code: 'US', views: 4821, pct: 57 },
  { country: 'Canada',        flag: '🇨🇦', code: 'CA', views: 1203, pct: 14 },
  { country: 'United Kingdom', flag: '🇬🇧', code: 'GB', views: 892,  pct: 11 },
  { country: 'Australia',     flag: '🇦🇺', code: 'AU', views: 612,  pct: 7 },
  { country: 'Other',         flag: '🌍', code: '--', views: 893,  pct: 11 },
]
const GEO_COLORS = ['#4F6EF7','#1ED8A0','#A855F7','#F5A623','#F06292']

const DEVICE_DATA = [
  { type: 'Desktop', icon: '🖥', pct: 54, color: '#4F6EF7', count: 4568 },
  { type: 'Mobile',  icon: '📱', pct: 38, color: '#1ED8A0', count: 3212 },
  { type: 'Tablet',  icon: '📲', pct: 8,  color: '#F5A623', count: 641 },
]

const BROWSER_DATA = [
  { name: 'Chrome',  icon: '🌐', pct: 61, color: '#4F6EF7', count: 5151 },
  { name: 'Safari',  icon: '🧭', pct: 22, color: '#1ED8A0', count: 1858 },
  { name: 'Firefox', icon: '🦊', pct: 9,  color: '#F5A623', count: 760 },
  { name: 'Edge',    icon: '🔷', pct: 6,  color: '#A855F7', count: 507 },
  { name: 'Other',   icon: '🔲', pct: 2,  color: '#64748B', count: 145 },
]

const ELEMENT_DATA = [
  { id:'cta-1', type:'email-capture', label:'Get the Free Playbook',     shown:6203, clicked:1891, dismissed:2847, skipped:1465, color:'#4F6EF7', triggerAt:'0:30' },
  { id:'cp-1',  type:'choice-point',  label:'What matters most to you?', shown:4102, clicked:4102, dismissed:0,    skipped:0,    color:'#A855F7', triggerAt:'0:55' },
  { id:'cta-2', type:'booking',       label:'Book a Strategy Call',       shown:3891, clicked:743,  dismissed:2104, skipped:1044, color:'#1ED8A0', triggerAt:'2:10' },
  { id:'hs-1',  type:'hotspot',       label:'See Product Details',       shown:2203, clicked:987,  dismissed:0,    skipped:1216, color:'#FF6B6B', triggerAt:'1:20' },
  { id:'cta-3', type:'download',      label:'Download Resource Guide',    shown:1847, clicked:612,  dismissed:891,  skipped:344,  color:'#F5A623', triggerAt:'3:05' },
]

const EL_ICONS  = { 'email-capture':'✉️','choice-point':'⑂','booking':'📅','hotspot':'🎯','download':'⬇️' }

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'geography', label: 'Geography' },
  { id: 'devices',   label: 'Devices & Browsers' },
  { id: 'elements',  label: 'Interactive Elements' },
]

const SHOW_INITIAL = 5

/* ── helpers ────────────────────────────────────────────────── */
function EngBar({ val, color, h = 5 }) {
  return (
    <div style={{ flex: 1, height: h, borderRadius: 3, background: 'var(--b2)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 3 }} />
    </div>
  )
}

function parseDur(s) {
  if (!s) return 240
  const p = s.split(':')
  return (parseInt(p[0]) || 0) * 60 + (parseInt(p[1]) || 0)
}

/* ── StatCard (matches HTML statCard helper) ────────────────── */
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{label}</div>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={14} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.5px', marginBottom: 2 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{sub}</div>
        <SparklineChart color={color} w={84} h={28} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Analytics() {
  const [tab, setTab]             = useState('overview')
  const [sel, setSel]             = useState(VIDEOS[0])
  const [expanded, setExpanded]   = useState(false)

  return (
    <div className="analytics-wrap" style={{ padding: 22 }}>

      {/* ── Tab bar ───────────────────────────────────────── */}
      <div className="analytics-tabs" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.15s',
              background: active ? 'var(--acc)' : 'var(--s3)',
              color: active ? '#fff' : 'var(--t2)',
              border: `1px solid ${active ? 'var(--acc)' : 'var(--b2)'}`,
            }}>{t.label}</button>
          )
        })}
      </div>

      {/* ── Grid: sidebar + content ───────────────────────── */}
      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>

        {/* ── Video selector (left) ──────────────────────── */}
        <div className="analytics-video-selector" style={{ width: 230, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Videos</div>

          <div style={expanded ? { overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' } : undefined}>
            {(expanded ? VIDEOS : VIDEOS.slice(0, SHOW_INITIAL)).map(v => {
              const isSel = sel.id === v.id
              const convRate = Math.round((v.plays / v.views) * 100)
              return (
                <div key={v.id} onClick={() => setSel(v)} style={{
                  padding: '11px 12px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                  background: isSel ? `${v.color}14` : 'var(--s2)',
                  border: `1px solid ${isSel ? `${v.color}44` : 'var(--b2)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                    <div style={{ width: 32, height: 22, borderRadius: 4, background: v.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="play" size={8} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: isSel ? 700 : 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>{v.dur} · {v.age}</div>
                    </div>
                    {isSel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: v.color }} />}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                    {[
                      { l: 'Views', v: v.views.toLocaleString() },
                      { l: 'Eng.', v: `${v.eng}%` },
                      { l: 'Conv.', v: `${convRate}%`, hi: v.eng > 75 },
                    ].map(s => (
                      <div key={s.l} style={{ textAlign: 'center', padding: 4, borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: s.hi ? '#1ED8A0' : 'var(--t1)' }}>{s.v}</div>
                        <div style={{ fontSize: 9, color: 'var(--t3)' }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {VIDEOS.length > SHOW_INITIAL && (
            <div onClick={() => setExpanded(e => !e)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: 9, marginTop: 6, borderRadius: 10, background: 'var(--s2)',
              border: '1px solid var(--b2)', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, color: 'var(--t2)',
            }}>
              {expanded ? '↑ Show less' : `↓ ${VIDEOS.length - SHOW_INITIAL} more videos`}
            </div>
          )}
        </div>

        {/* ── Tab content (right) ────────────────────────── */}
        <div>
          {tab === 'overview'  && <OverviewTab sel={sel} />}
          {tab === 'geography' && <GeographyTab sel={sel} />}
          {tab === 'devices'   && <DevicesTab />}
          {tab === 'elements'  && <ElementsTab />}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB: OVERVIEW
   ═══════════════════════════════════════════════════════════════ */
function OverviewTab({ sel }) {
  const totalSecs  = parseDur(sel.dur)
  const avgSecs    = Math.round(totalSecs * (sel.eng / 100))
  const avgDur     = `${Math.floor(avgSecs / 60)}:${(avgSecs % 60).toString().padStart(2, '0')}`
  const estLeads   = Math.round(sel.plays * 0.12)
  const capRate    = sel.plays > 0 ? Math.round(estLeads / sel.plays * 100) : 0
  const convRate   = sel.views > 0 ? (estLeads / sel.views * 100).toFixed(1) : 0
  const capBadge   = capRate >= 15 ? 'Strong' : capRate >= 8 ? 'Good' : capRate >= 4 ? 'Average' : 'Low'
  const convBadge  = convRate >= 10 ? 'Excellent' : convRate >= 5 ? 'Good' : convRate >= 2 ? 'Average' : 'Low'
  const rewatchPct = sel.plays > sel.views ? Math.round((sel.plays - sel.views) / sel.views * 100) : 0
  const rewBadge   = rewatchPct >= 25 ? 'High — strong interest' : rewatchPct >= 12 ? 'Good' : rewatchPct >= 5 ? 'Average' : 'Low'
  const returnPct  = Math.round(Math.min(sel.eng, 99) * 0.35)
  const retBadge   = returnPct >= 30 ? 'High — loyal audience' : returnPct >= 18 ? 'Good' : returnPct >= 8 ? 'Average' : 'Low'

  return (
    <div>
      {/* ── 3-col stats ─────────────────────────────────── */}
      <div className="analytics-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
        <StatCard label="Views"      value={sel.views.toLocaleString()} sub="+12% this week"                                          color="#4F6EF7" icon="eye" />
        <StatCard label="Plays"      value={sel.plays.toLocaleString()} sub={`${Math.round(sel.plays / sel.views * 100)}% play rate`} color="#06B6D4" icon="play" />
        <StatCard label="Engagement" value={`${sel.eng}%`}              sub="Avg watch depth"                                          color="#1ED8A0" icon="zap" />
      </div>

      {/* ── 4-col stats ─────────────────────────────────── */}
      <div className="analytics-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
        <StatCard label="Est. Leads"        value={estLeads.toString()}  sub={`${Math.round(estLeads / sel.views * 100)}% capture rate`} color="#F5A623" icon="mail" />
        <StatCard label="Avg View Duration" value={avgDur}               sub={`of ${sel.dur} total`}                                     color="#A855F7" icon="play" />
        <StatCard label="Lead Capture Rate" value={`${capRate}%`}        sub={capBadge}                                                   color="#FF6B6B" icon="mail" />
        <StatCard label="Conversion Rate"   value={`${convRate}%`}       sub={`${convBadge} · leads ÷ views`}                             color="#1ED8A0" icon="zap" />
      </div>

      {/* ── 2-col stats ─────────────────────────────────── */}
      <div className="analytics-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard label="Rewatch Rate"   value={`${rewatchPct}%`} sub={`${rewBadge} — replays per unique viewer`}  color="#06B6D4" icon="play" />
        <StatCard label="Return Viewers" value={`${returnPct}%`}  sub={`${retBadge} — watched more than once`}     color="#1ED8A0" icon="eye" />
      </div>

      {/* ── Heatmap ─────────────────────────────────────── */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '20px 22px', marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>{sel.title}</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 18 }}>Engagement heatmap · {sel.dur}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 76, marginBottom: 7 }}>
          {HEATMAP.map((h, i) => {
            const p = h / 100
            const c = p > .8 ? '#4F6EF7' : p > .6 ? '#06B6D4' : p > .4 ? '#F5A623' : '#FF6B6B'
            return <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0', background: c, opacity: 0.85 }} />
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)' }}>
          <span>0:00</span><span>{sel.dur}</span>
        </div>
      </div>

      {/* ── Drop Points ─────────────────────────────────── */}
      <DropPoints sel={sel} />

      {/* ── Play-through by segment ─────────────────────── */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>Play-through by segment</div>
        {['0–25%', '25–50%', '50–75%', '75–100%'].map((seg, i) => {
          const vals = [sel.eng + 5, sel.eng - 3, sel.eng - 8, sel.eng - 15]
          const v = Math.max(0, vals[i])
          const c = v > 80 ? '#1ED8A0' : v > 65 ? '#4F6EF7' : v > 50 ? '#F5A623' : '#FF6B6B'
          return (
            <div key={seg} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--t2)', width: 55 }}>{seg}</span>
              <EngBar val={v} color={c} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', width: 32 }}>{Math.round(v)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Drop Points sub-component ──────────────────────────────── */
function DropPoints({ sel }) {
  const totalSecs = parseDur(sel.dur)
  const drops = []
  for (let i = 1; i < HEATMAP.length; i++) {
    const drop = Math.round(HEATMAP[i - 1] - HEATMAP[i])
    if (drop >= 8) {
      const atSecs = Math.round((i / HEATMAP.length) * totalSecs)
      const m = Math.floor(atSecs / 60)
      const s = atSecs % 60
      const ts = `${m}:${s < 10 ? '0' : ''}${s}`
      const sev = drop >= 20 ? 'critical' : drop >= 13 ? 'major' : 'notable'
      const col = drop >= 20 ? '#FF6B6B' : drop >= 13 ? '#F5A623' : '#4F6EF7'
      drops.push({ ts, drop, sev, col, before: Math.round(HEATMAP[i - 1]), after: Math.round(HEATMAP[i]), idx: i })
    }
  }
  drops.sort((a, b) => b.drop - a.drop)

  const tips = {
    critical: ['Hard sell or unexpected ask — viewers bail fast here', 'Pacing drops significantly — consider re-editing this section', 'Technical issue likely here (audio drop, visual glitch)'],
    major: ['Transition feels abrupt or off-topic', 'Content complexity spikes — consider simplifying', 'Add a pattern interrupt or visual hook here'],
    notable: ['Slight pacing dip — monitor over time', 'May naturally resolve as audience size grows'],
  }

  if (drops.length === 0) {
    return (
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '20px 22px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Drop Points</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Moments where viewers stop watching</div>
          </div>
        </div>
        <div style={{ background: 'rgba(30,216,160,0.07)', border: '1px solid rgba(30,216,160,0.2)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <span style={{ fontSize: 13, color: 'var(--grn)', fontWeight: 600 }}>No major drop points — strong retention throughout.</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '20px 22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Drop Points</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{drops.length} moment{drops.length !== 1 ? 's' : ''} where viewers stop watching</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--t3)' }}>Sorted by severity</div>
      </div>

      {drops.map((d, i) => {
        const tipArr = tips[d.sev]
        const tip = tipArr[i % tipArr.length]
        return (
          <div key={i} style={{ border: `1px solid ${d.col}33`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, background: `${d.col}08` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ background: `${d.col}18`, color: d.col, fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 0.5 }}>{d.sev}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--t1)', background: 'var(--s3)', padding: '3px 9px', borderRadius: 6 }}>⏱ {d.ts}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: d.col }}>↓ {d.drop}% drop</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 'auto' }}>{i === 0 ? 'Biggest' : `#${i + 1}`}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--t3)', minWidth: 28, textAlign: 'right' }}>{d.before}%</span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--s3)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${d.before}%`, background: 'var(--grn)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${d.after}%`, background: d.col, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 10, color: d.col, minWidth: 28 }}>{d.after}%</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.6 }}>💡 {tip}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB: GEOGRAPHY
   ═══════════════════════════════════════════════════════════════ */
function GeographyTab({ sel }) {
  return (
    <div>
      {/* ── Views by Country bar chart ───────────────────── */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '20px 22px', marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Views by Country</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 18 }}>{sel.views.toLocaleString()} total views · last 30 days</div>

        {GEO_DATA.map((g, i) => (
          <div key={g.code} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < GEO_DATA.length - 1 ? 13 : 0 }}>
            <div style={{ fontSize: 18, flexShrink: 0, width: 26, textAlign: 'center' }}>{g.flag}</div>
            <div style={{ width: 130, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{g.country}</div>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${g.pct}%`, background: GEO_COLORS[i], borderRadius: 4, transition: 'width 0.4s' }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{g.views.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>{g.pct}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom 3-col stat cards ──────────────────────── */}
      <div className="analytics-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <StatCard label="Top Country" value="🇺🇸 USA"  sub="57% of all views"       color="#4F6EF7" icon="eye" />
        <StatCard label="Countries"   value="7"         sub="Viewers worldwide"      color="#1ED8A0" icon="zap" />
        <StatCard label="Intl. Views" value="43%"       sub="Outside home country"   color="#F5A623" icon="chart" />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB: DEVICES & BROWSERS
   ═══════════════════════════════════════════════════════════════ */
function DevicesTab() {
  const R = 30 // donut radius
  const C = Math.PI * 2 * R // circumference ≈ 188.5
  let offset = 0

  const ENGAGE_DATA = [
    { device: 'Desktop 🖥', eng: 82, conv: '14.2%', avgWatch: '2:41', color: '#4F6EF7' },
    { device: 'Mobile 📱',  eng: 71, conv: '11.8%', avgWatch: '2:08', color: '#1ED8A0' },
    { device: 'Tablet 📲',  eng: 76, conv: '12.9%', avgWatch: '2:22', color: '#F5A623' },
  ]

  return (
    <div>
      {/* ── 2-col: Device Type + Browser ─────────────────── */}
      <div className="analytics-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Device breakdown */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Device Type</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 18 }}>How viewers watch</div>

          {/* Donut + legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                {DEVICE_DATA.map(d => {
                  const dash = (d.pct / 100) * C
                  const el = (
                    <circle key={d.type} cx="40" cy="40" r={R} fill="none"
                      stroke={d.color} strokeWidth="12"
                      strokeDasharray={`${dash} ${C}`}
                      strokeDashoffset={-offset}
                      transform="rotate(-90 40 40)" />
                  )
                  offset += dash
                  return el
                })}
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              {DEVICE_DATA.map(d => (
                <div key={d.type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--t1)', flex: 1 }}>{d.icon} {d.type}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bars */}
          {DEVICE_DATA.map(d => (
            <div key={d.type} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--t2)', width: 60 }}>{d.type}</span>
              <EngBar val={d.pct} color={d.color} />
              <span style={{ fontSize: 11, color: 'var(--t3)', width: 42, textAlign: 'right' }}>{d.count.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Browser breakdown */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Browser</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 18 }}>Where viewers watch</div>

          {BROWSER_DATA.map((b, i) => (
            <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < BROWSER_DATA.length - 1 ? 12 : 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${b.color}18`, border: `1px solid ${b.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{b.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{b.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.pct}%</span>
                </div>
                <EngBar val={b.pct} color={b.color} h={4} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', width: 38, textAlign: 'right', flexShrink: 0 }}>{b.count.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Engagement by Device ─────────────────────────── */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>Engagement by Device</div>
        <div className="analytics-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {ENGAGE_DATA.map(d => (
            <div key={d.device} style={{ background: 'var(--s3)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--b1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>{d.device}</div>
              {[
                ['Engagement', `${d.eng}%`, d.color],
                ['CTA Conv.', d.conv, '#A855F7'],
                ['Avg Watch', d.avgWatch, '#F5A623'],
              ].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, color: 'var(--t2)' }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB: INTERACTIVE ELEMENTS
   ═══════════════════════════════════════════════════════════════ */
function ElementsTab() {
  const totalShown    = ELEMENT_DATA.reduce((a, e) => a + e.shown, 0)
  const totalClicked  = ELEMENT_DATA.reduce((a, e) => a + e.clicked, 0)
  const avgCTR        = Math.round(ELEMENT_DATA.reduce((a, e) => a + (e.clicked / e.shown * 100), 0) / ELEMENT_DATA.length)
  const totalDismiss  = ELEMENT_DATA.reduce((a, e) => a + e.dismissed, 0)

  return (
    <div>
      {/* ── Summary stat row ─────────────────────────────── */}
      <div className="analytics-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Shown"  value={totalShown.toLocaleString()}   sub="Times displayed"     color="#4F6EF7" icon="eye" />
        <StatCard label="Total Clicks" value={totalClicked.toLocaleString()} sub="Across all elements" color="#1ED8A0" icon="zap" />
        <StatCard label="Avg CTR"      value={`${avgCTR}%`}                  sub="Click-through rate"  color="#F5A623" icon="chart" />
        <StatCard label="Dismissed"    value={totalDismiss.toLocaleString()} sub="Manually closed"     color="#FF6B6B" icon="x" />
      </div>

      {/* ── Element table ────────────────────────────────── */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
        {/* Table header */}
        <div className="analytics-el-table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 80px 100px', gap: 0, padding: '11px 18px', borderBottom: '1px solid var(--b1)', background: 'var(--s3)' }}>
          {['Element', 'Shown', 'Clicked', 'Dismissed', 'Skipped', 'CTR'].map((h, i) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, ...(i > 0 ? { textAlign: 'center' } : {}) }}>{h}</div>
          ))}
        </div>

        {/* Element rows */}
        {ELEMENT_DATA.map((el, i) => {
          const ctr = Math.round((el.clicked / el.shown) * 100)
          const ctrColor = ctr > 30 ? '#1ED8A0' : ctr > 15 ? '#F5A623' : '#FF6B6B'
          return (
            <div key={el.id} className="analytics-el-row" style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 80px 100px', gap: 0, padding: '14px 18px', borderBottom: i < ELEMENT_DATA.length - 1 ? '1px solid var(--b1)' : 'none', alignItems: 'center' }}>
              {/* Element info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${el.color}18`, border: `1px solid ${el.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {EL_ICONS[el.type] || '⚡'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{el.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: `${el.color}18`, color: el.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{el.type}</span>
                    <span>fires at {el.triggerAt}</span>
                  </div>
                </div>
              </div>
              {/* Stats */}
              <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{el.shown.toLocaleString()}</div>
              <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#1ED8A0' }}>{el.clicked.toLocaleString()}</div>
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t2)' }}>{el.dismissed.toLocaleString()}</div>
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>{el.skipped.toLocaleString()}</div>
              {/* CTR with bar */}
              <div style={{ padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: ctrColor }}>{ctr}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${ctr}%`, background: ctrColor, borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Viewer Behaviour Breakdown ────────────────────── */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Viewer Behaviour Breakdown</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 18 }}>What viewers did when each element appeared</div>

        {ELEMENT_DATA.map(el => {
          const total = el.shown
          const clickPct   = Math.round((el.clicked / total) * 100)
          const dismissPct = Math.round((el.dismissed / total) * 100)
          const skippedPct = Math.round((el.skipped / total) * 100)
          return (
            <div key={el.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 13 }}>{EL_ICONS[el.type]}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', flex: 1 }}>{el.label}</span>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>{el.shown.toLocaleString()} shown</span>
              </div>
              {/* Stacked bar */}
              <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 6 }}>
                <div style={{ flex: clickPct, background: '#1ED8A0', borderRadius: '5px 0 0 5px', minWidth: clickPct > 0 ? 4 : 0 }} title={`Clicked: ${clickPct}%`} />
                <div style={{ flex: dismissPct, background: '#FF6B6B', minWidth: dismissPct > 0 ? 4 : 0 }} title={`Dismissed: ${dismissPct}%`} />
                <div style={{ flex: skippedPct, background: 'rgba(255,255,255,0.08)', borderRadius: '0 5px 5px 0', minWidth: skippedPct > 0 ? 4 : 0 }} title={`Skipped: ${skippedPct}%`} />
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 14 }}>
                <span style={{ fontSize: 11, color: '#1ED8A0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#1ED8A0', display: 'inline-block' }} />Clicked {clickPct}%
                </span>
                <span style={{ fontSize: 11, color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#FF6B6B', display: 'inline-block' }} />Dismissed {dismissPct}%
                </span>
                <span style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} />No action {skippedPct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
