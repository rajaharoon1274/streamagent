'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = s => {
  const sec = Math.max(0, Math.floor(s))
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

function parseDur(v) {
  if (typeof v === 'number') return v
  const parts = String(v || '0:00').split(':')
  return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0)
}

function getEdgesForNode(node) {
  const edges = []
  if (!node?.choicePoints) return edges
  node.choicePoints.forEach(cp => {
    ;(cp.choices || []).forEach(ch => {
      if (ch.targetId) edges.push({ to: ch.targetId, choice: ch, cp })
    })
  })
  return edges
}

// ─── Component ────────────────────────────────────────────────────────────────
// Props:
//   nodes       — full node array for this route
//   routeEls    — { nodeId: element[] }
//   videos      — VIDEOS array (for aspect ratio, dur)
//   mode        — 'desktop' | 'mobile'
//   onClose     — () => void
export default function RoutePreviewModal({ nodes = [], routeEls = {}, videos = [], mode = 'desktop', onClose }) {
  const root = nodes.find(r => r.isRoot) || nodes[0]

  const [st, setSt] = useState({
    nodeId:         root?.id || null,
    progress:       0,
    playing:        false,
    history:        [],           // [{id, title, label, color}]
    showingChoices: false,
    ended:          false,
  })

  const stRef      = useRef(st)
  const intervalRef = useRef(null)
  stRef.current    = st

  // ── Derived from state ──────────────────────────────────────────────────────
  const node    = nodes.find(r => r.id === st.nodeId) || nodes[0]
  const video   = node?.videoId ? videos.find(v => v.id === node.videoId) : null
  const dur     = video ? parseDur(video.dur) : (node?.duration || 120)
  const pct     = dur > 0 ? (st.progress / dur) * 100 : 0
  const edges   = node ? getEdgesForNode(node) : []
  const nodeEdges = edges.map(e => {
    const target = nodes.find(r => r.id === e.to)
    return target ? { ...e, targetNode: target } : null
  }).filter(Boolean)

  // ── Visible elements ────────────────────────────────────────────────────────
  const els = routeEls[node?.id] || []
  const visEls = els.filter(el => {
    if (!el.timing) return false
    const inT = el.timing.in ?? 0
    const dur2 = el.timing.duration ?? 999
    if (st.progress < inT || st.progress > inT + dur2) return false
    // Device conditions
    if (el.conditions?.length > 0) {
      for (const c of el.conditions) {
        if (c.type === 'device' && c.value) {
          const vals = c.value.split(',')
          const wantMobile  = vals.includes('mobile')
          const wantDesktop = vals.includes('desktop')
          if (mode === 'mobile'  && wantDesktop && !wantMobile)  return false
          if (mode === 'desktop' && wantMobile  && !wantDesktop) return false
        }
      }
    }
    return true
  })

  // ── Playback ───────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const s = stRef.current
    if (!s.playing) return
    const n   = nodes.find(r => r.id === s.nodeId)
    const vid = n?.videoId ? videos.find(v => v.id === n.videoId) : null
    const d   = vid ? parseDur(vid.dur) : (n?.duration || 120)
    const newProgress = +(s.progress + 0.25).toFixed(2)

    // Check if a choice point should trigger
    let shouldShowChoices = false
    const edgesNow = n ? getEdgesForNode(n) : []
    if (!s.showingChoices && edgesNow.length > 0) {
      if (n?.choicePoints?.some(cp => newProgress >= (cp.triggerAt || d * 0.9))) {
        shouldShowChoices = true
      }
      if ((newProgress / d) * 100 >= 90) shouldShowChoices = true
    }

    // End of video
    if (newProgress >= d && !shouldShowChoices) {
      clearInterval(intervalRef.current)
      setSt(prev => ({ ...prev, progress: d, playing: false, ended: edgesNow.length === 0 }))
      return
    }

    if (shouldShowChoices) {
      clearInterval(intervalRef.current)
      setSt(prev => ({ ...prev, progress: newProgress, playing: false, showingChoices: true }))
      return
    }

    setSt(prev => ({ ...prev, progress: newProgress }))
  }, [nodes, videos])

  useEffect(() => {
    if (st.playing) {
      intervalRef.current = setInterval(tick, 250)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [st.playing, tick])

  // ── ESC to close ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') { clearInterval(intervalRef.current); onClose() } }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // ── Actions ─────────────────────────────────────────────────────────────────
  function togglePlay() {
    if (st.ended || st.showingChoices) return
    setSt(prev => ({ ...prev, playing: !prev.playing }))
  }

  function scrub(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const newP = Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * dur, dur))
    clearInterval(intervalRef.current)
    setSt(prev => ({ ...prev, progress: newP, playing: false, showingChoices: false, ended: false }))
  }

  function chooseNext(targetId, label, color) {
    clearInterval(intervalRef.current)
    const fromTitle = node?.title || '?'
    setSt(prev => ({
      nodeId:         targetId,
      progress:       0,
      playing:        true,
      history:        [...prev.history, { id: prev.nodeId, title: fromTitle, label, color }],
      showingChoices: false,
      ended:          false,
    }))
  }

  function restart() {
    clearInterval(intervalRef.current)
    setSt({ nodeId: root?.id, progress: 0, playing: false, history: [], showingChoices: false, ended: false })
  }

  function close() { clearInterval(intervalRef.current); onClose() }

  // ── Aspect ratio ────────────────────────────────────────────────────────────
  const ar    = video?.aspectRatio || '16:9'
  const arCss = ar === '9:16' ? '9/16' : ar === '1:1' ? '1/1' : ar === '4:5' ? '4/5' : '16/9'
  const maxW  = ar === '9:16' ? (mode === 'mobile' ? '100%' : '320px')
              : ar === '1:1'  ? (mode === 'mobile' ? '100%' : '540px')
              : (mode === 'mobile' ? '100%' : '960px')

  // ── Inner content (shared between desktop and mobile) ───────────────────────
  function renderContent() {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:'#080c18' }}>

        {/* ── Top bar ── */}
        <div style={{ height:48, background:'rgba(12,15,28,.95)', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', padding:'0 16px', gap:12, flexShrink:0 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:node?.color || '#4F6EF7', animation:'pulse 2s infinite' }}/>
          <span style={{ fontSize:13, fontWeight:700, color:'#EEF2FF', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{node?.title}</span>

          {/* Breadcrumb */}
          {st.history.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:3, overflow:'hidden', maxWidth:260 }}>
              {st.history.map((h, i) => (
                <span key={i} style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
                  <span style={{ fontSize:9, color:'rgba(255,255,255,.35)', maxWidth:70, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.title}</span>
                  <span style={{ fontSize:9, color:h.color || '#7B87A0' }}> → </span>
                </span>
              ))}
              <span style={{ fontSize:9, fontWeight:700, color:'#EEF2FF', whiteSpace:'nowrap' }}>{node?.title}</span>
            </div>
          )}

          <span style={{ fontSize:11, fontFamily:'monospace', color:'rgba(255,255,255,.4)', flexShrink:0 }}>{fmt(st.progress)} / {fmt(dur)}</span>
          <button onClick={close}
            style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            ✕
          </button>
        </div>

        {/* ── Video area ── */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', padding: mode === 'mobile' ? '8px' : '24px', position:'relative' }}>
          <div style={{ position:'relative', width:'100%', maxWidth:maxW, aspectRatio:arCss, background:`linear-gradient(135deg,${node?.color || '#4F6EF7'}15,${node?.color || '#4F6EF7'}08)`, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,.06)', boxShadow:'0 20px 60px rgba(0,0,0,.5)' }}>

            {/* Dot grid */}
            <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize:'22px 22px', pointerEvents:'none' }}/>

            {/* Video placeholder */}
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:`${node?.color || '#4F6EF7'}33`, border:`2px solid ${node?.color || '#4F6EF7'}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="8,5 19,12 8,19"/></svg>
              </div>
              <div style={{ fontSize: mode === 'mobile' ? 13 : 16, fontWeight:700, color:'#EEF2FF', marginBottom:4 }}>{node?.title}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>
                {video?.dur || fmt(dur)} · {node?.isRoot ? 'Entry Point' : 'Route Video'}
              </div>
            </div>

            {/* Progress bar on video */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:4, background:'rgba(255,255,255,.1)' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:node?.color || '#4F6EF7', borderRadius:'0 2px 2px 0', transition:'width .2s' }}/>
            </div>

            {/* Overlay elements */}
            {visEls.map(el => {
              const isFS = ['funnel-urgency','cta-email','cta-booking','cta-download','survey-poll','survey-rating','survey-nps'].includes(el.type)
              if (isFS) return null // rendered separately below
              const xP = ((el.xPct ?? 10)).toFixed(2)
              const yP = ((el.yPct ?? 10)).toFixed(2)
              const wP = ((el.wPct ?? 40)).toFixed(2)
              const hP = ((el.hPct ?? 15)).toFixed(2)
              const p  = el.props || {}
              const clr = p.buttonColor || p.color || '#4F6EF7'
              const label = p.headline || p.text || p.question || p.label || el.type
              return (
                <div key={el.id} style={{ position:'absolute', left:`${xP}%`, top:`${yP}%`, width:`${wP}%`, height:`${hP}%`, borderRadius:8, overflow:'hidden', border:`1.5px solid ${clr}55`, background:`${clr}18`, backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'4px 8px', animation:'saFadeIn .3s ease' }}>
                  <span style={{ fontSize:14 }}>{el.props?.icon || '⚡'}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textShadow:'0 1px 4px rgba(0,0,0,.5)' }}>{label}</span>
                </div>
              )
            })}

            {/* Full-screen gate overlays */}
            {visEls.filter(el => ['funnel-urgency','cta-email','cta-booking','cta-download','survey-poll','survey-rating','survey-nps'].includes(el.type)).map(el => {
              const p = el.props || {}
              const clr = p.buttonColor || '#4F6EF7'
              return (
                <div key={el.id} style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(14,20,40,.95),rgba(8,15,32,.95))', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5, animation:'saFadeIn .3s ease' }}>
                  <div style={{ background:'rgba(7,9,15,.92)', border:'1px solid rgba(255,255,255,.1)', borderRadius:16, padding:'20px 24px', width:'88%', maxWidth:300, textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,.6)' }}>
                    <div style={{ fontSize:24, marginBottom:10 }}>{el.type === 'cta-booking' ? '📅' : el.type === 'cta-download' ? '⬇️' : el.type.startsWith('survey') ? '📊' : '✉️'}</div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:6, lineHeight:1.3 }}>{p.headline || 'Continue Watching'}</div>
                    {p.sub && <div style={{ fontSize:10, color:'rgba(255,255,255,.45)', marginBottom:12 }}>{p.sub}</div>}
                    <div style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:7, padding:'8px 10px', fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:6, textAlign:'left' }}>your@email.com</div>
                    <div style={{ background:clr, borderRadius:9, padding:'10px 14px', fontSize:11, fontWeight:800, color:'#fff' }}>{p.buttonText || 'Continue →'}</div>
                  </div>
                </div>
              )
            })}

            {/* Choice overlay */}
            {st.showingChoices && nodeEdges.length > 0 && (
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(6px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:20, animation:'saFadeIn .3s ease', zIndex:10 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:6 }}>Choose your path</div>
                {nodeEdges.map(e => (
                  <button key={e.choice.id}
                    onClick={() => chooseNext(e.to, e.choice.label, e.choice.color || node?.color)}
                    style={{ padding:'13px 24px', borderRadius:12, background:`${e.choice.color || node?.color}22`, border:`1.5px solid ${e.choice.color || node?.color}55`, color:'#fff', fontSize: mode === 'mobile' ? 12 : 14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:10, minWidth: mode === 'mobile' ? 180 : 220, width:'100%', maxWidth:300, transition:'all .15s', fontFamily:'inherit' }}
                    onMouseOver={ev => { ev.currentTarget.style.background = `${e.choice.color || node?.color}44`; ev.currentTarget.style.transform = 'scale(1.02)' }}
                    onMouseOut={ev  => { ev.currentTarget.style.background = `${e.choice.color || node?.color}22`; ev.currentTarget.style.transform = 'scale(1)' }}>
                    <span style={{ fontSize: mode === 'mobile' ? 18 : 22, flexShrink:0 }}>{e.choice.icon || '▶'}</span>
                    <div style={{ textAlign:'left', flex:1, minWidth:0 }}>
                      <div style={{ marginBottom:2 }}>{e.choice.label}</div>
                      <div style={{ fontSize:10, fontWeight:400, color:'rgba(255,255,255,.45)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>→ {e.targetNode.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* End state */}
            {st.ended && !st.showingChoices && (
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, animation:'saFadeIn .3s ease', zIndex:10 }}>
                <div style={{ fontSize:36, marginBottom:4 }}>🏁</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>End of Route</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.45)', marginBottom:8 }}>No more connections from this video</div>
                <button onClick={restart}
                  style={{ padding:'10px 24px', borderRadius:10, background:'#4F6EF7', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  ↺ Start Over
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Control bar ── */}
        <div style={{ height:56, background:'rgba(12,15,28,.95)', borderTop:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', padding:'0 20px', gap:14, flexShrink:0 }}>
          {/* Play/pause */}
          <button onClick={togglePlay} disabled={st.showingChoices || st.ended}
            style={{ width:36, height:36, borderRadius:'50%', background:st.playing ? 'rgba(255,255,255,.15)' : (node?.color || '#4F6EF7'), border:'none', color:'#fff', fontSize:14, cursor: st.showingChoices || st.ended ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: st.showingChoices || st.ended ? 0.4 : 1, flexShrink:0 }}>
            {st.playing
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="6,3 20,12 6,21"/></svg>}
          </button>

          {/* Scrubber */}
          <div onClick={scrub}
            style={{ flex:1, height:6, background:'rgba(255,255,255,.1)', borderRadius:3, cursor:'pointer', position:'relative' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:node?.color || '#4F6EF7', borderRadius:3, transition:'width .15s' }}/>
            <div style={{ position:'absolute', left:`${pct}%`, top:'50%', width:14, height:14, borderRadius:'50%', background:'#fff', transform:'translate(-50%,-50%)', boxShadow:'0 2px 6px rgba(0,0,0,.4)', transition:'left .15s' }}/>
          </div>

          <span style={{ fontSize:11, fontFamily:'monospace', color:'rgba(255,255,255,.45)', minWidth:80, textAlign:'center', flexShrink:0 }}>{fmt(st.progress)} / {fmt(dur)}</span>

          <button onClick={restart}
            style={{ padding:'6px 14px', borderRadius:7, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', color:'rgba(255,255,255,.6)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
            ↺ Restart
          </button>
        </div>
      </div>
    )
  }

  // ── DESKTOP mode ─────────────────────────────────────────────────────────────
  if (mode === 'desktop') {
    return (
      <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#000', display:'flex', flexDirection:'column', animation:'fadeIn .2s ease' }}>
        {renderContent()}
      </div>
    )
  }

  // ── MOBILE phone frame mode ───────────────────────────────────────────────────
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.88)', display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn .2s ease' }}>
      {/* Close button outside frame */}
      <button onClick={close}
        style={{ position:'absolute', top:20, right:20, padding:'8px 16px', borderRadius:8, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.25)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', backdropFilter:'blur(8px)', zIndex:10 }}>
        ✕ Close Preview
      </button>

      {/* Mode label */}
      <div style={{ position:'absolute', top:20, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:100, padding:'6px 16px' }}>
        <span style={{ fontSize:12 }}>📱</span>
        <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>Mobile Preview</span>
      </div>

      {/* Phone frame */}
      <div style={{ width:375, height:812, borderRadius:40, background:'#000', border:'3px solid rgba(255,255,255,.15)', boxShadow:'0 0 80px rgba(0,0,0,.6)', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
        {/* Notch */}
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:150, height:28, background:'#000', borderRadius:'0 0 20px 20px', zIndex:10 }}/>
        {/* Status bar */}
        <div style={{ height:48, background:'rgba(0,0,0,.9)', display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:6, flexShrink:0, position:'relative', zIndex:5 }}>
          <span style={{ fontSize:11, fontWeight:600, color:'#fff' }}>9:41</span>
        </div>
        {/* Content */}
        <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
          {renderContent()}
        </div>
        {/* Home indicator */}
        <div style={{ height:20, background:'#000', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <div style={{ width:120, height:4, borderRadius:2, background:'rgba(255,255,255,.3)' }}/>
        </div>
      </div>
    </div>
  )
}