'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import BuilderElementsEditor from './Builderelementseditor'
import RoutePreviewModal     from './Routepreviewmodal'
import ShareDrawer           from './ShareDrawer'

// ─── Static data ───────────────────────────────────────────────────────────────
const VIDEOS = [
  { id:1,  title:'Platform Overview',       dur:'4:00', views:8421,  eng:78,  color:'#4F6EF7', aspectRatio:'16:9' },
  { id:2,  title:'Lead Generation Guide',   dur:'3:00', views:3102,  eng:91,  color:'#1ED8A0', aspectRatio:'16:9' },
  { id:3,  title:'Conversion Masterclass',  dur:'3:20', views:1847,  eng:65,  color:'#A855F7', aspectRatio:'9:16' },
  { id:4,  title:'Brand Strategy',          dur:'2:40', views:5209,  eng:82,  color:'#F5A623', aspectRatio:'16:9' },
  { id:5,  title:'Referral Strategy',       dur:'2:20', views:920,   eng:88,  color:'#1ED8A0', aspectRatio:'16:9' },
  { id:6,  title:'Digital Lead Mastery',    dur:'2:30', views:412,   eng:93,  color:'#F06292', aspectRatio:'16:9' },
  { id:7,  title:'60-Second Listing Hook',  dur:'1:00', views:12840, eng:94,  color:'#FF6B6B', aspectRatio:'9:16' },
  { id:8,  title:'Agent Intro Reel',        dur:'0:45', views:8920,  eng:89,  color:'#A855F7', aspectRatio:'9:16' },
  { id:9,  title:'Market Update Short',     dur:'1:30', views:6340,  eng:86,  color:'#06B6D4', aspectRatio:'9:16' },
  { id:10, title:'Testimonial Spotlight',   dur:'2:00', views:4210,  eng:91,  color:'#F5A623', aspectRatio:'1:1'  },
]

const MAKE_NODES = () => ([
  {
    id:'root', videoId:1, title:'Platform Overview', x:300, y:90, color:'#4F6EF7', duration:240, isRoot:true,
    choicePoints:[{
      id:'cp1', triggerAt:60, question:"What's your biggest challenge?", subtitle:'Choose your path',
      choices:[
        { id:'c1a', label:'More leads',         icon:'🎯', color:'#4F6EF7', targetId:'lead-gen'   },
        { id:'c1b', label:'Better conversions',  icon:'💰', color:'#1ED8A0', targetId:'conversion' },
      ],
    }],
  },
  { id:'lead-gen',   videoId:2, title:'Lead Generation Guide',  x:60,  y:380, color:'#1ED8A0', duration:180, isRoot:false, choicePoints:[] },
  { id:'conversion', videoId:3, title:'Conversion Masterclass', x:540, y:380, color:'#A855F7', duration:200, isRoot:false, choicePoints:[] },
])

const MAKE_ROUTES = () => ([
  { id:'sr1', name:'Buyer Journey',   videos:['root','lead-gen','conversion'], connections:2, _nodes: MAKE_NODES() },
  { id:'sr2', name:'Seller Sequence', videos:[], connections:0, _nodes:[] },
])

const NODE_W = 220
const NODE_H = 148   // slightly taller to fit footer hint
const COLORS = ['#4F6EF7','#1ED8A0','#F5A623','#F06292','#A855F7','#FF6B6B','#06B6D4','#E879F9']
const mkId   = () => Math.random().toString(36).slice(2, 8)
const fmt    = s  => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

// ─── Edge helpers ──────────────────────────────────────────────────────────────
function getEdges(nodes) {
  const e = []
  nodes.forEach(n => {
    ;(n.choicePoints || []).forEach(cp => {
      ;(cp.choices || []).forEach(ch => {
        if (ch.targetId) {
          const t = nodes.find(x => x.id === ch.targetId)
          if (t) e.push({ from:n, to:t, choice:ch, cp })
        }
      })
    })
  })
  return e
}

// ─── Shared button styles ──────────────────────────────────────────────────────
const tbBtn  = { padding:'5px 10px', borderRadius:7, background:'var(--s3)', border:'1px solid var(--b2)', color:'var(--t2)', fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontFamily:'inherit' }
const iconBtn = { width:22, height:22, borderRadius:5, background:'var(--s2)', border:'1px solid var(--b2)', color:'var(--t3)', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'inherit' }

// ─── Mobile CSS (injected once) ────────────────────────────────────────────────
const MOBILE_CSS = `
@media(max-width:768px){
  .builder-sidebar{position:fixed!important;top:0!important;left:-280px!important;bottom:60px!important;width:270px!important;z-index:55!important;box-shadow:8px 0 32px rgba(0,0,0,.5)!important;transition:left .25s ease!important}
  .builder-sidebar-open .builder-sidebar{left:0!important}
  .builder-sidebar-toggle{display:flex!important}
  .builder-sidebar-overlay{display:none}
  .builder-sidebar-open .builder-sidebar-overlay{display:block!important}
  .builder-toolbar{height:auto!important;min-height:42px!important;padding:5px 8px!important;overflow-x:auto!important;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch;gap:4px!important}
  .node-config-panel{position:fixed!important;inset:0!important;z-index:56!important;width:100%!important;max-width:100%!important;border:none!important}
}
@media(max-width:480px){
  .builder-toolbar .tb-label{display:none}
}
`

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN BUILDER
// ═══════════════════════════════════════════════════════════════════════════════
export default function Builder() {
  // ── Route / node state ──────────────────────────────────────────────────────
  const [streamRoutes,  setStreamRoutes]  = useState(MAKE_ROUTES)
  const [activeRouteId, setActiveRouteId] = useState('sr1')
  const [nodes,         setNodes]         = useState(MAKE_NODES)
  const [selNodeId,     setSelNodeId]     = useState(null)
  const [editingNodeId, setEditingNodeId] = useState(null)
  const [routeEls,      setRouteEls]      = useState({})
  const [landingPages,  setLandingPages]  = useState({})  // routeId -> landing page config

  // ── Canvas viewport ─────────────────────────────────────────────────────────
  const [vp,    setVp]    = useState({ x:60, y:40 })
  const [scale, setScale] = useState(0.9)

  // ── UI state ────────────────────────────────────────────────────────────────
  const [previewMode,   setPreviewMode]   = useState(null)   // null | 'desktop' | 'mobile'
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [search,        setSearch]        = useState('')
  const [folderOpen,    setFolderOpen]    = useState(false)
  const [libExpanded,   setLibExpanded]   = useState(false)
  const [newRouteModal, setNewRouteModal] = useState(false)
  const [newRouteName,  setNewRouteName]  = useState('')
  const [shareOpen,     setShareOpen]     = useState(false)
  const [unsavedModal,  setUnsavedModal]  = useState(false)
  const [pendingId,     setPendingId]     = useState(null)
  const [savedHash,     setSavedHash]     = useState(() => JSON.stringify(MAKE_NODES()))
  const [saveFlash,     setSaveFlash]     = useState(false)   // 'saved' | 'auto' | false
  const autoSaveRef = useRef(null)

  // ── Stable refs ─────────────────────────────────────────────────────────────
  const canvasRef  = useRef(null)
  const vpRef      = useRef(vp)
  const scaleRef   = useRef(scale)
  const nodesRef   = useRef(nodes)
  vpRef.current    = vp
  scaleRef.current = scale
  nodesRef.current = nodes

  // ── Mobile CSS injection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById('builder-mobile-css')) return
    const s = document.createElement('style')
    s.id = 'builder-mobile-css'; s.textContent = MOBILE_CSS
    document.head.appendChild(s)
  }, [])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const edges       = getEdges(nodes)
  const editNode    = editingNodeId ? nodes.find(r => r.id === editingNodeId) : null
  const selNode     = selNodeId     ? nodes.find(r => r.id === selNodeId)     : null
  const hasUnsaved  = savedHash !== JSON.stringify(nodes)
  const usedVids    = nodes.map(r => r.videoId).filter(Boolean)
  const activeSR    = streamRoutes.find(r => r.id === activeRouteId)
  const slug        = activeSR ? activeSR.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'my-route'
  const filteredVids = (libExpanded ? VIDEOS : VIDEOS.slice(0, 6)).filter(v =>
    !search || v.title.toLowerCase().includes(search.toLowerCase())
  )

  // ── Auto-save after changes ──────────────────────────────────────────────────
  function scheduleAutoSave() {
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      setSavedHash(JSON.stringify(nodesRef.current))
      syncFolder(nodesRef.current)
      setSaveFlash('auto')
      setTimeout(() => setSaveFlash(false), 2500)
    }, 3000)
  }

  // ── Sync folder ──────────────────────────────────────────────────────────────
  function syncFolder(nr, aid) {
    const id = aid !== undefined ? aid : activeRouteId
    if (!id) return
    setStreamRoutes(prev => prev.map(sr => sr.id === id ? {
      ...sr,
      videos:      nr.map(r => r.id),
      connections: getEdges(nr).length,
      _nodes:      JSON.parse(JSON.stringify(nr)),
    } : sr))
  }

  // ── Wheel zoom ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current; if (!el) return
    const handler = e => {
      e.preventDefault()
      const d  = e.deltaY > 0 ? -0.08 : 0.08
      const ns = Math.max(0.25, Math.min(2, scaleRef.current + d))
      const rc = el.getBoundingClientRect()
      const cx = e.clientX - rc.left, cy = e.clientY - rc.top
      const nv = {
        x: cx - (cx - vpRef.current.x) * (ns / scaleRef.current),
        y: cy - (cy - vpRef.current.y) * (ns / scaleRef.current),
      }
      scaleRef.current = ns; vpRef.current = nv
      setScale(ns); setVp({ ...nv })
    }
    el.addEventListener('wheel', handler, { passive:false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // ── Canvas pan (mouse) ────────────────────────────────────────────────────────
  function onCanvasMouseDown(e) {
    const t   = e.target
    const isBg = t === canvasRef.current || ['svg','path','polygon','text','g'].includes(t.tagName)
    if (!isBg) return
    const sx = e.clientX - vpRef.current.x, sy = e.clientY - vpRef.current.y
    const mv = me => { const nv = { x:me.clientX-sx, y:me.clientY-sy }; vpRef.current=nv; setVp({...nv}) }
    const up = () => { document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up) }
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up)
  }

  // ── Canvas pan (touch) ────────────────────────────────────────────────────────
  function onCanvasTouchStart(e) {
    if (e.touches.length !== 1) return
    const t = e.target
    if (t !== canvasRef.current && t.tagName !== 'svg') return
    const tc = e.touches[0]
    const sx = tc.clientX - vpRef.current.x, sy = tc.clientY - vpRef.current.y
    const mv = me => {
      if (me.touches.length !== 1) return
      const tt = me.touches[0]
      const nv = { x:tt.clientX-sx, y:tt.clientY-sy }
      vpRef.current=nv; setVp({...nv})
    }
    const up = () => { document.removeEventListener('touchmove',mv); document.removeEventListener('touchend',up) }
    document.addEventListener('touchmove', mv, { passive:false })
    document.addEventListener('touchend', up)
  }

  // ── Node drag ─────────────────────────────────────────────────────────────────
  function onNodeMouseDown(e, id) {
    if (e.button !== 0) return
    e.stopPropagation()
    setSelNodeId(id)
    const node = nodesRef.current.find(r => r.id === id); if (!node) return
    const sx = e.clientX - node.x * scaleRef.current
    const sy = e.clientY - node.y * scaleRef.current
    const stX = e.clientX, stY = e.clientY
    let moved = false
    const mv = me => {
      if (!moved && Math.abs(me.clientX-stX) < 5 && Math.abs(me.clientY-stY) < 5) return
      moved = true
      node.x = (me.clientX - sx) / scaleRef.current
      node.y = (me.clientY - sy) / scaleRef.current
      const el = document.getElementById('bn-'+id)
      if (el) { el.style.left = node.x+'px'; el.style.top = node.y+'px' }
    }
    const up = () => {
      document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up)
      if (moved) { setNodes([...nodesRef.current]); syncFolder(nodesRef.current); scheduleAutoSave() }
    }
    document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up)
  }

  // ── Video palette drag ─────────────────────────────────────────────────────────
  function onPaletteMouseDown(e, videoId) {
    if (e.button !== 0) return
    e.preventDefault(); e.stopPropagation()
    const v = VIDEOS.find(x => x.id === videoId); if (!v) return
    const ghost = document.createElement('div')
    ghost.style.cssText = `position:fixed;pointer-events:none;z-index:99999;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.5);width:160px;opacity:.92;left:${e.clientX-80}px;top:${e.clientY-30}px`
    ghost.innerHTML = `<div style="height:44px;background:${v.color};display:flex;align-items:center;justify-content:center"><div style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;font-size:9px">▶</div></div><div style="background:#0C0F1C;padding:7px 9px;border:1px solid ${v.color}44;border-top:none;border-radius:0 0 10px 10px"><div style="font-size:11px;font-weight:700;color:#EEF2FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v.title}</div><div style="font-size:9px;color:#7B87A0;margin-top:2px">${v.dur}</div></div>`
    document.body.appendChild(ghost)
    const canvas = canvasRef.current
    if (canvas) canvas.style.outline = `2px dashed ${v.color}88`
    const mv = me => {
      ghost.style.left = (me.clientX-80)+'px'; ghost.style.top = (me.clientY-30)+'px'
      if (canvas) {
        const rc = canvas.getBoundingClientRect()
        const over = me.clientX>=rc.left&&me.clientX<=rc.right&&me.clientY>=rc.top&&me.clientY<=rc.bottom
        canvas.style.outline = over ? `2px solid ${v.color}` : `2px dashed ${v.color}88`
        ghost.style.opacity  = over ? '1' : '0.75'
      }
    }
    const up = me => {
      ghost.parentNode?.removeChild(ghost)
      if (canvas) canvas.style.outline = ''
      document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up)
      if (!canvas) return
      const rc = canvas.getBoundingClientRect()
      const on = me.clientX>=rc.left&&me.clientX<=rc.right&&me.clientY>=rc.top&&me.clientY<=rc.bottom
      if (on) {
        const x = (me.clientX - rc.left - vpRef.current.x) / scaleRef.current - NODE_W/2
        const y = (me.clientY - rc.top  - vpRef.current.y) / scaleRef.current - NODE_H/2
        addNode(videoId, Math.max(0, x), Math.max(0, y))
      }
    }
    document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up)
  }

  // ── Node CRUD ──────────────────────────────────────────────────────────────────
  function addNode(videoId, x, y) {
    const v = VIDEOS.find(xv => xv.id === videoId); if (!v) return
    const id = mkId()
    const nx = x ?? (-vpRef.current.x/scaleRef.current)+100+nodesRef.current.length*40
    const ny = y ?? (-vpRef.current.y/scaleRef.current)+100+nodesRef.current.length*30
    const n  = { id, videoId:v.id, title:v.title, color:v.color, duration:240, x:nx, y:ny, isRoot:nodesRef.current.length===0, choicePoints:[] }
    const nr = [...nodesRef.current, n]
    nodesRef.current=nr; setNodes(nr); setSelNodeId(id); syncFolder(nr); scheduleAutoSave()
  }

  function removeNode(id) {
    const nr = nodesRef.current.filter(r=>r.id!==id).map(r=>({
      ...r,
      choicePoints:(r.choicePoints||[]).map(cp=>({
        ...cp, choices:(cp.choices||[]).filter(ch=>ch.targetId!==id)
      })).filter(cp=>(cp.choices||[]).length>0)
    }))
    nodesRef.current=nr; setNodes(nr)
    if (selNodeId===id)    setSelNodeId(null)
    if (editingNodeId===id) setEditingNodeId(null)
    syncFolder(nr); scheduleAutoSave()
  }

  function updateNode(id, patch) {
    const nr = nodesRef.current.map(r => r.id===id ? {...r,...patch} : r)
    nodesRef.current=nr; setNodes(nr); syncFolder(nr); scheduleAutoSave()
  }

  function duplicateNode(id) {
    const n = nodesRef.current.find(r=>r.id===id); if (!n) return
    const newId = mkId()
    const nd = {...JSON.parse(JSON.stringify(n)), id:newId, x:n.x+30, y:n.y+30, isRoot:false, choicePoints:[]}
    const nr = [...nodesRef.current, nd]
    nodesRef.current=nr; setNodes(nr); setSelNodeId(newId); syncFolder(nr); scheduleAutoSave()
  }

  function quickConnect(fromId, toId) {
    const f = nodesRef.current.find(r=>r.id===fromId)
    const t = nodesRef.current.find(r=>r.id===toId)
    if (!f||!t) return
    if ((f.choicePoints||[]).some(cp=>(cp.choices||[]).some(ch=>ch.targetId===toId))) return
    updateNode(fromId, { choicePoints:[...(f.choicePoints||[]),{
      id:mkId(), triggerAt:60, question:'What would you like to do next?', subtitle:'Choose your path',
      choices:[{id:mkId(), label:t.title, icon:'▶', color:t.color||'#4F6EF7', targetId:toId}]
    }]})
  }

  function disconnectNodes(fromId, toId) {
    const f = nodesRef.current.find(r=>r.id===fromId); if (!f) return
    updateNode(fromId, { choicePoints:(f.choicePoints||[]).map(cp=>({
      ...cp, choices:(cp.choices||[]).filter(ch=>ch.targetId!==toId)
    })).filter(cp=>(cp.choices||[]).length>0)})
  }

  // ── Auto-layout (BFS) ─────────────────────────────────────────────────────────
  function autoLayout() {
    const es   = getEdges(nodesRef.current)
    const root = nodesRef.current.find(r=>r.isRoot) || nodesRef.current[0]
    if (!root) return
    const levels={[root.id]:0}, queue=[root.id], visited={[root.id]:true}
    while (queue.length) {
      const cur = queue.shift()
      es.filter(e=>e.from.id===cur).forEach(e=>{
        if (!visited[e.to.id]) { visited[e.to.id]=true; levels[e.to.id]=(levels[cur]||0)+1; queue.push(e.to.id) }
      })
    }
    nodesRef.current.forEach(r=>{ if(levels[r.id]===undefined) levels[r.id]=0 })
    const byLv={}
    nodesRef.current.forEach(r=>{ const lv=levels[r.id]||0; if(!byLv[lv]) byLv[lv]=[]; byLv[lv].push(r) })
    const nr = nodesRef.current.map(r=>({...r}))
    Object.keys(byLv).sort((a,b)=>+a-+b).forEach(lv=>{
      let x=80; byLv[lv].forEach(n=>{ const nd=nr.find(r=>r.id===n.id); if(nd){nd.x=x;nd.y=60+(+lv)*220}; x+=290 })
    })
    nodesRef.current=nr; setNodes([...nr]); setVp({x:0,y:0}); setScale(0.9); syncFolder(nr)
  }

  // ── Fit screen ────────────────────────────────────────────────────────────────
  function fitScreen() {
    if (!nodesRef.current.length) return
    const xs=nodesRef.current.map(r=>r.x), ys=nodesRef.current.map(r=>r.y)
    const minX=Math.min(...xs)-40, minY=Math.min(...ys)-40
    const maxX=Math.max(...xs)+NODE_W+40, maxY=Math.max(...ys)+NODE_H+40
    const canvas=canvasRef.current
    const cw=canvas?canvas.clientWidth:800, ch=canvas?canvas.clientHeight:500
    const sc=+Math.min(cw/(maxX-minX), ch/(maxY-minY), 1.4).toFixed(2)
    const nv={x:-minX*sc+20, y:-minY*sc+20}
    scaleRef.current=sc; vpRef.current=nv; setScale(sc); setVp(nv)
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  function saveRoute() {
    clearTimeout(autoSaveRef.current)
    setSavedHash(JSON.stringify(nodesRef.current))
    syncFolder(nodesRef.current)
    setSaveFlash('saved')
    setTimeout(() => setSaveFlash(false), 2500)
  }

  function tryLoadRoute(id) {
    if (hasUnsaved) { setPendingId(id); setUnsavedModal(true); return }
    doLoad(id)
  }

  function doLoad(id) {
    const sr = streamRoutes.find(r=>r.id===id); if (!sr) return
    const nd = sr._nodes ? JSON.parse(JSON.stringify(sr._nodes)) : []
    nodesRef.current=nd; setNodes(nd); setActiveRouteId(id)
    setSelNodeId(null); setEditingNodeId(null)
    setVp({x:60,y:40}); setScale(0.9); setSavedHash(JSON.stringify(nd)); setSidebarOpen(false)
  }

  function confirmNewRoute() {
    if (!newRouteName.trim()) return
    const id = mkId()
    setStreamRoutes(prev=>[...prev,{id,name:newRouteName,videos:[],connections:0,_nodes:[]}])
    nodesRef.current=[]; setNodes([]); setActiveRouteId(id)
    setSelNodeId(null); setEditingNodeId(null); setVp({x:60,y:40}); setScale(0.9); setSavedHash('[]')
    setNewRouteName(''); setNewRouteModal(false)
  }

  function deleteStreamRoute(id) {
    setStreamRoutes(prev=>prev.filter(r=>r.id!==id))
    if (activeRouteId===id) { nodesRef.current=[]; setNodes([]); setActiveRouteId(null); setSelNodeId(null); setEditingNodeId(null) }
  }

  function dupStreamRoute(id) {
    const sr = streamRoutes.find(r=>r.id===id); if (!sr) return
    const copy={...JSON.parse(JSON.stringify(sr)), id:mkId(), name:sr.name+' (copy)'}
    setStreamRoutes(prev=>[...prev,copy])
  }

  // ── Elements editor open/close ────────────────────────────────────────────────
  function openEditor(id) {
    if (editingNodeId===id) { setEditingNodeId(null) }
    else {
      setEditingNodeId(id); setSelNodeId(null)
      setRouteEls(prev=>({...prev,[id]:prev[id]||[]}))
      setSidebarOpen(false)
    }
  }

  function handleElChange(nodeId, newEls) {
    setRouteEls(prev => ({ ...prev, [nodeId]: newEls }))
    scheduleAutoSave()
  }

  // ── Save status display ───────────────────────────────────────────────────────
  const saveLabel = saveFlash === 'saved' ? '✓ Saved'
    : saveFlash === 'auto' ? '✓ Auto-saved'
    : hasUnsaved ? '● Save' : '✓ Saved'
  const saveBg    = hasUnsaved && !saveFlash ? 'var(--acc)' : 'var(--s3)'
  const saveColor = hasUnsaved && !saveFlash ? '#fff' : saveFlash ? 'var(--grn)' : 'var(--t2)'
  const saveBorder = hasUnsaved && !saveFlash ? 'var(--acc)' : saveFlash ? 'var(--grn)' : 'var(--b2)'

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', flexDirection:'column', fontFamily:"'Outfit',-apple-system,sans-serif" }}>

      {/* ════ TOOLBAR ════ */}
      <div className="builder-toolbar" style={{ background:'var(--s1)', borderBottom:'1px solid var(--b1)', display:'flex', alignItems:'center', padding:'0 12px', gap:5, flexShrink:0, height:46, overflow:'hidden' }}>

        <span style={{ fontSize:14, fontWeight:800, color:'var(--t1)', whiteSpace:'nowrap', flexShrink:0 }}>Route Builder</span>
        <div style={{ width:1, height:18, background:'var(--b2)', flexShrink:0, marginRight:1 }}/>

        <button onClick={()=>setNewRouteModal(true)} style={{ padding:'5px 12px', borderRadius:8, background:'linear-gradient(135deg,rgba(79,110,247,.15),rgba(168,85,247,.15))', border:'1px solid rgba(79,110,247,.4)', color:'#a78bfa', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontFamily:'inherit' }}>
          + New Route
        </button>

        <button onClick={fitScreen}  style={tbBtn}>⤢ <span className="tb-label">Fit</span></button>
        <button onClick={autoLayout} style={tbBtn}>⊞ <span className="tb-label">Auto-Layout</span></button>

        {/* ▶ Desktop preview */}
        <button onClick={() => setPreviewMode('desktop')}
          style={{ ...tbBtn, background:'var(--s3)' }}>
          ▶ <span className="tb-label">Preview</span>
        </button>

        {/* 📱 Mobile preview */}
        <button onClick={() => setPreviewMode('mobile')}
          style={{ ...tbBtn }}>
          📱
        </button>

        <div style={{ flex:1 }}/>

        <span style={{ fontSize:10, color:'var(--t3)', whiteSpace:'nowrap', flexShrink:0, marginRight:2 }}>
          {nodes.length} vid{nodes.length!==1?'s':''} · {edges.length} conn
        </span>

        {/* Zoom */}
        <button onClick={()=>setScale(s=>Math.max(0.25,+(s-0.1).toFixed(2)))} style={{ width:26, height:26, borderRadius:6, background:'var(--s3)', border:'1px solid var(--b2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'var(--t2)', cursor:'pointer', flexShrink:0, fontFamily:'inherit' }}>−</button>
        <span style={{ fontSize:10, color:'var(--t2)', fontFamily:'monospace', width:34, textAlign:'center', flexShrink:0 }}>{Math.round(scale*100)}%</span>
        <button onClick={()=>setScale(s=>Math.min(2,+(s+0.1).toFixed(2)))}    style={{ width:26, height:26, borderRadius:6, background:'var(--s3)', border:'1px solid var(--b2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'var(--t2)', cursor:'pointer', flexShrink:0, fontFamily:'inherit' }}>+</button>

        {/* Save */}
        <button onClick={saveRoute}
          style={{ ...tbBtn, background:saveBg, border:`1px solid ${saveBorder}`, color:saveColor, fontWeight:700, transition:'all .3s' }}>
          {saveLabel}
        </button>

        {activeRouteId && (
          <button onClick={() => { if(window.confirm('Delete this route?')) deleteStreamRoute(activeRouteId) }}
            style={{ ...tbBtn, background:'rgba(255,107,107,.1)', border:'1px solid rgba(255,107,107,.25)', color:'var(--red)' }}>
            Delete
          </button>
        )}

        <button onClick={() => setShareOpen(!shareOpen)}
          style={{ padding:'5px 12px', borderRadius:7, background:'var(--acc)', color:'#fff', border:'none', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontFamily:'inherit' }}>
          Share
        </button>
      </div>

      {/* ════ BODY ════ */}
      <div className={sidebarOpen ? 'builder-sidebar-open' : ''} style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0, position:'relative' }}>

        {/* ── VIDEO PALETTE SIDEBAR ── */}
        <div className="builder-sidebar" style={{ width:210, background:'var(--s1)', borderRight:'1px solid var(--b1)', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden' }}>

          {/* StreamRoutes folder */}
          <div style={{ borderBottom:'1px solid var(--b1)', flexShrink:0 }}>
            <div style={{ padding:'10px 12px 6px', fontSize:11, fontWeight:700, color:'var(--t1)' }}>StreamRoutes</div>
            <div style={{ padding:'0 10px 8px' }}>
              {(folderOpen ? streamRoutes : streamRoutes.slice(0,4)).map(sr => (
                <div key={sr.id} onClick={() => tryLoadRoute(sr.id)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 8px', borderRadius:9, marginBottom:3, cursor:'pointer', background:activeRouteId===sr.id?'rgba(79,110,247,.12)':'var(--s3)', border:`1px solid ${activeRouteId===sr.id?'rgba(79,110,247,.3)':'var(--b2)'}`, transition:'border-color .15s' }}>
                  <span style={{ fontSize:13 }}>📁</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:activeRouteId===sr.id?'var(--acc)':'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sr.name}</div>
                    <div style={{ fontSize:9, color:'var(--t3)' }}>{sr.videos.length} vids · {sr.connections} conn</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();dupStreamRoute(sr.id)}}     title="Dup"    style={iconBtn}>⧉</button>
                  <button onClick={e=>{e.stopPropagation();if(window.confirm('Delete?'))deleteStreamRoute(sr.id)}} title="Del" style={{...iconBtn,background:'rgba(255,107,107,.06)',border:'1px solid rgba(255,107,107,.2)',color:'var(--red)'}}>✕</button>
                  {activeRouteId===sr.id && <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--acc)', flexShrink:0 }}/>}
                </div>
              ))}
              {streamRoutes.length > 4 && (
                <button onClick={() => setFolderOpen(!folderOpen)} style={{ width:'100%', padding:'5px 8px', borderRadius:7, background:'var(--s3)', border:'1px solid var(--b2)', color:'var(--t3)', fontSize:10, fontWeight:600, cursor:'pointer', marginTop:3, fontFamily:'inherit' }}>
                  {folderOpen ? '▲ Show less' : `▼ ${streamRoutes.length-4} more routes`}
                </button>
              )}
            </div>
          </div>

          {/* Video library */}
          <div style={{ padding:'10px 12px 6px', borderBottom:'1px solid var(--b1)', flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--t1)', marginBottom:4 }}>Video Library</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'var(--s3)', border:'1px solid var(--b2)', borderRadius:7, padding:'5px 8px', marginBottom:4 }}>
              <span style={{ fontSize:11, color:'var(--t3)', flexShrink:0 }}>🔍</span>
              <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ border:'none', background:'transparent', fontSize:10, color:'var(--t1)', width:'100%', outline:'none', fontFamily:'inherit' }}/>
            </div>
            <div style={{ fontSize:9, color:'var(--t3)' }}>Drag onto canvas · Double-click to add</div>
          </div>

          <div style={{ overflowY:'auto', padding:10, flex:1 }}>
            {filteredVids.map(v => {
              const inUse  = usedVids.includes(v.id)
              const isEdit = editingNodeId && nodes.find(r=>r.videoId===v.id)?.id===editingNodeId
              return (
                <div key={v.id}
                  onMouseDown={e => onPaletteMouseDown(e, v.id)}
                  onDoubleClick={() => addNode(v.id)}
                  style={{ borderRadius:10, marginBottom:7, overflow:'hidden', cursor:'grab', border:`1.5px solid ${isEdit?v.color:inUse?v.color+'44':'var(--b2)'}`, background:'var(--bg)', transition:'all .15s', userSelect:'none' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=v.color+'99'; e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=isEdit?v.color:inUse?v.color+'44':'var(--b2)'; e.currentTarget.style.boxShadow='' }}>
                  <div style={{ height:44, background:v.color, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(255,255,255,.85)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9 }}>▶</div>
                    {isEdit && <div style={{ position:'absolute', top:3, left:4, fontSize:8, fontWeight:800, color:'#fff', background:v.color, padding:'1px 5px', borderRadius:3 }}>EDITING</div>}
                    {!isEdit && inUse && <div style={{ position:'absolute', top:3, left:4, fontSize:8, fontWeight:800, color:'#fff', background:'rgba(0,0,0,.45)', padding:'1px 5px', borderRadius:3 }}>ON CANVAS</div>}
                    <div style={{ position:'absolute', bottom:3, right:5, fontSize:8, color:'#fff', background:'rgba(0,0,0,.5)', padding:'1px 4px', borderRadius:3 }}>{v.dur}</div>
                  </div>
                  <div style={{ padding:'6px 8px' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.title}</div>
                    <div style={{ fontSize:8, color:'var(--t3)' }}>{v.eng}% engagement</div>
                  </div>
                </div>
              )
            })}
            {VIDEOS.length > 6 && (
              <div onClick={() => setLibExpanded(!libExpanded)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:8, marginTop:4, borderRadius:8, background:'var(--s2)', border:'1px solid var(--b2)', cursor:'pointer', fontSize:10, fontWeight:600, color:'var(--t2)' }}>
                {libExpanded ? '↑ Show less' : `↓ ${VIDEOS.length-6} more videos`}
              </div>
            )}
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="builder-sidebar-overlay" onClick={() => setSidebarOpen(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:54 }}/>
        )}
        <button className="builder-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ display:'none', position:'fixed', bottom:72, left:12, zIndex:60, padding:'8px 14px', borderRadius:10, background:'var(--acc)', color:'#fff', fontSize:11, fontWeight:700, border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(79,110,247,.4)', alignItems:'center', gap:5, fontFamily:'inherit' }}>
          🎬 Videos
        </button>

        {/* ══ CANVAS + ELEMENTS EDITOR ══ */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* ── Main canvas ── */}
          <div id="builder-canvas" ref={canvasRef}
            onMouseDown={onCanvasMouseDown}
            onTouchStart={onCanvasTouchStart}
            onClick={e => {
              if (e.target === canvasRef.current || e.target.tagName === 'svg') {
                setSelNodeId(null)
                // Close editor when clicking blank canvas
                if (editingNodeId) setEditingNodeId(null)
              }
            }}
            style={{
              ...(editNode ? {height:220,flexShrink:0} : {flex:1}),
              overflow:'hidden', position:'relative', cursor:'default',
              backgroundImage:'radial-gradient(circle,rgba(255,255,255,.09) 1px,transparent 1px)',
              backgroundSize:`${24*scale}px ${24*scale}px`,
              backgroundPosition:`${vp.x}px ${vp.y}px`,
            }}>

            {/* Transform layer */}
            <div style={{ position:'absolute', transform:`translate(${vp.x}px,${vp.y}px) scale(${scale})`, transformOrigin:'0 0' }}>

              {/* ── SVG edges — pill-shaped labels ── */}
              <svg style={{ position:'absolute', overflow:'visible', top:0, left:0, width:1, height:1, pointerEvents:'none' }}>
                {edges.map(e => {
                  const x1=e.from.x+NODE_W/2, y1=e.from.y+NODE_H
                  const x2=e.to.x+NODE_W/2,   y2=e.to.y
                  const mY=(y1+y2)/2, mX=(x1+x2)/2
                  const c = e.choice.color || e.from.color || '#4F6EF7'
                  const labelText = `${e.choice.icon || ''} ${(e.choice.label || '').slice(0,10)}`
                  return (
                    <g key={`${e.from.id}-${e.to.id}-${e.choice.id}`}>
                      {/* Bezier path */}
                      <path d={`M${x1},${y1} C${x1},${mY} ${x2},${mY} ${x2},${y2}`}
                        fill="none" stroke={`${c}66`} strokeWidth={2} strokeDasharray="5,4"/>
                      {/* Arrow */}
                      <polygon points={`${x2},${y2} ${x2-5},${y2-8} ${x2+5},${y2-8}`} fill={c} opacity={0.85}/>
                      {/* Pill label */}
                      <g transform={`translate(${mX},${mY})`}>
                        <rect x="-34" y="-11" width="68" height="22" rx="11" fill={`${c}22`} stroke={`${c}55`} strokeWidth={1}/>
                        <text textAnchor="middle" dominantBaseline="middle" fill={c} fontSize={9} fontWeight={700} fontFamily="'Outfit',sans-serif">
                          {labelText}
                        </text>
                      </g>
                    </g>
                  )
                })}
              </svg>

              {/* ── Node cards ── */}
              {nodes.map(node => {
                const isSel  = selNodeId===node.id
                const isEdit = editingNodeId===node.id
                const nEdges = edges.filter(e=>e.from.id===node.id)
                const hasOut = nEdges.length>0
                const isLeaf = !node.isRoot && !hasOut
                const elCnt  = (routeEls[node.id]||[]).length

                return (
                  <div key={node.id} id={'bn-'+node.id} className="node-card"
                    onMouseDown={e => onNodeMouseDown(e, node.id)}
                    onClick={e => { e.stopPropagation(); setSidebarOpen(false); openEditor(node.id) }}
                    style={{
                      position:'absolute', left:node.x, top:node.y, width:NODE_W,
                      background:'var(--s2)',
                      border:`2px solid ${isEdit ? node.color : isSel ? node.color+'88' : 'var(--b2)'}`,
                      borderRadius:13, overflow:'hidden', cursor:'pointer',
                      boxShadow: isEdit
                        ? `0 0 0 3px ${node.color}40,0 10px 40px rgba(0,0,0,.6)`
                        : isSel ? `0 0 0 2px ${node.color}30,0 6px 24px rgba(0,0,0,.4)`
                        : '0 4px 18px rgba(0,0,0,.3)',
                      transition:'all .15s', userSelect:'none',
                    }}>

                    {/* Color bar */}
                    <div style={{ height:3, background:node.color }}/>

                    {/* Thumbnail area */}
                    <div style={{ height:52, background:`${node.color}18`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:node.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff' }}>▶</div>
                      {node.isRoot && <div style={{ position:'absolute', top:4, left:6, fontSize:8, fontWeight:800, color:node.color, background:`${node.color}22`, border:`1px solid ${node.color}44`, padding:'1px 6px', borderRadius:100 }}>ENTRY</div>}
                      {isEdit     && <div style={{ position:'absolute', top:4, right:6, fontSize:8, fontWeight:800, color:'#fff', background:node.color, padding:'1px 6px', borderRadius:3 }}>● EDITING</div>}
                      <div style={{ position:'absolute', bottom:3, right:6, fontSize:8, color:'var(--t3)' }}>{fmt(node.duration)}</div>
                      <button className="node-remove-btn" onClick={e=>{e.stopPropagation();removeNode(node.id)}}
                        style={{ position:'absolute', top:3, right:isEdit?52:6, width:20, height:20, borderRadius:6, background:'rgba(0,0,0,.7)', border:'1px solid rgba(255,107,107,.4)', color:'var(--red)', fontSize:11, cursor:'pointer', display:'none', alignItems:'center', justifyContent:'center', padding:0, lineHeight:1, fontFamily:'inherit' }}>
                        ✕
                      </button>
                    </div>

                    {/* Title + badges */}
                    <div style={{ padding:'8px 10px 5px' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{node.title}</div>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {elCnt>0 && <span style={{ fontSize:9, fontWeight:700, background:'rgba(30,216,160,.1)', color:'var(--grn)', padding:'1px 6px', borderRadius:100 }}>⚡ {elCnt} el{elCnt!==1?'s':''}</span>}
                        {isLeaf   && <span style={{ fontSize:9, fontWeight:700, background:'rgba(255,107,107,.1)', color:'var(--red)', padding:'1px 6px', borderRadius:100 }}>⚠ Dead end</span>}
                        {!node.isRoot&&hasOut && <span style={{ fontSize:9, background:'rgba(79,110,247,.08)', color:'var(--acc)', padding:'1px 6px', borderRadius:100 }}>{nEdges.length} branch{nEdges.length!==1?'es':''}</span>}
                      </div>
                    </div>

                    {/* Choice point previews */}
                    {(node.choicePoints||[]).length>0 && (
                      <div style={{ borderTop:'1px solid var(--b1)', padding:'4px 10px 5px' }}>
                        {(node.choicePoints||[]).flatMap(cp=>(cp.choices||[]).map(ch=>(
                          <div key={ch.id} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, color:'var(--t3)', marginBottom:1 }}>
                            <div style={{ width:5, height:5, borderRadius:'50%', background:ch.color||node.color, flexShrink:0 }}/>
                            {ch.icon} {ch.label}
                            {ch.targetId && <span style={{ color:'var(--acc)', opacity:.7 }}> → {nodes.find(r=>r.id===ch.targetId)?.title}</span>}
                          </div>
                        )))}
                      </div>
                    )}

                    {/* ── Footer hint (matches HTML) ── */}
                    <div style={{ padding:'4px 10px 7px', fontSize:9, color:isEdit?node.color:'var(--t3)' }}>
                      {isEdit ? '● Click to close editor' : 'Click to open editor'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Empty state */}
            {nodes.length===0 && (
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <div style={{ fontSize:38, marginBottom:12, opacity:.2 }}>🎬</div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--t2)', marginBottom:5 }}>Drag videos here to start</div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>Build your StreamRoute from the left panel</div>
              </div>
            )}

            <div style={{ position:'absolute', bottom:8, left:8, fontSize:9, color:'var(--t3)', pointerEvents:'none', zIndex:4 }}>
              Drag to pan · Scroll to zoom · Click a card to open editor
            </div>

            {nodes.length>0 && !editNode && <Minimap nodes={nodes} editingNodeId={editingNodeId}/>}
          </div>

          {/* ── ELEMENTS EDITOR ── */}
          {editNode && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
              <BuilderElementsEditor
                key={editNode.id}
                node={editNode}
                elements={routeEls[editNode.id]||[]}
                allNodes={nodes}
                edges={edges}
                videos={VIDEOS}
                onChange={newEls => handleElChange(editNode.id, newEls)}
                onNodeChange={(nodeId, patch) => updateNode(nodeId, patch)}
                onClose={() => setEditingNodeId(null)}
              />
            </div>
          )}
        </div>

        {/* ── NODE CONFIG PANEL ── */}
        {selNode && !editNode && (
          <NodeConfigPanel
            node={selNode} allNodes={nodes} edges={edges}
            onChange={patch => updateNode(selNode.id, patch)}
            onClose={() => setSelNodeId(null)}
            onDelete={() => removeNode(selNode.id)}
            onDuplicate={() => duplicateNode(selNode.id)}
            onOpenEditor={() => openEditor(selNode.id)}
            onConnect={quickConnect}
            onDisconnect={disconnectNodes}
          />
        )}

        {/* ── SHARE PANEL ── */}
        {shareOpen && (
          <ShareDrawer 
            slug={slug} 
            routeName={activeSR?.name} 
            routeId={activeSR?.id}
            nodes={nodes}
            landingPage={landingPages[activeSR?.id]}
            onEditLP={(lp) => setLandingPages(prev => ({ ...prev, [activeSR?.id]: lp }))}
            onClose={()=>setShareOpen(false)}
          />
        )}
      </div>

      {/* ════ ROUTE PREVIEW MODAL ════ */}
      {previewMode && (
        <RoutePreviewModal
          nodes={nodes}
          routeEls={routeEls}
          videos={VIDEOS}
          mode={previewMode}
          onClose={() => setPreviewMode(null)}
        />
      )}

      {/* ════ MODALS ════ */}
      {newRouteModal && (
        <Modal onClose={()=>setNewRouteModal(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--t1)', marginBottom:4 }}>Create New Route</div>
          <div style={{ fontSize:11, color:'var(--t3)', marginBottom:16 }}>Give your StreamRoute a name to get started</div>
          <label style={{ fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:6 }}>Route Name</label>
          <input autoFocus value={newRouteName} onChange={e=>setNewRouteName(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&confirmNewRoute()}
            placeholder="e.g. Buyer Journey, Listing Walkthrough..."
            style={{ width:'100%', background:'var(--s3)', border:'1px solid var(--b2)', borderRadius:9, padding:'12px 14px', color:'var(--t1)', fontSize:14, marginBottom:16, boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}/>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setNewRouteModal(false)} style={{ flex:1, padding:11, borderRadius:9, background:'var(--s3)', border:'1px solid var(--b2)', color:'var(--t2)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button onClick={confirmNewRoute}             style={{ flex:1, padding:11, borderRadius:9, background:'var(--acc)', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Create Route</button>
          </div>
        </Modal>
      )}

      {unsavedModal && (
        <Modal onClose={()=>setUnsavedModal(false)} zIndex={9999}>
          <div style={{ fontSize:24, textAlign:'center', marginBottom:12 }}>⚠️</div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--t1)', textAlign:'center', marginBottom:6 }}>Unsaved Changes</div>
          <div style={{ fontSize:12, color:'var(--t2)', textAlign:'center', lineHeight:1.6, marginBottom:22 }}>You have unsaved changes. Save before switching routes?</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={()=>{saveRoute();doLoad(pendingId);setUnsavedModal(false)}} style={{ width:'100%', padding:11, borderRadius:10, background:'var(--acc)', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Save & Switch</button>
            <button onClick={()=>{doLoad(pendingId);setUnsavedModal(false)}}            style={{ width:'100%', padding:11, borderRadius:10, background:'var(--s3)', border:'1px solid var(--b2)', color:'var(--red)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Discard Changes</button>
            <button onClick={()=>setUnsavedModal(false)}                                style={{ width:'100%', padding:11, borderRadius:10, background:'none', border:'1px solid var(--b1)', color:'var(--t2)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINIMAP
// ═══════════════════════════════════════════════════════════════════════════════
function Minimap({ nodes, editingNodeId }) {
  if (!nodes.length) return null
  const xs=nodes.map(r=>r.x), ys=nodes.map(r=>r.y)
  const minX=Math.min(...xs)-20, maxX=Math.max(...xs)+NODE_W+20
  const minY=Math.min(...ys)-20, maxY=Math.max(...ys)+NODE_H+20
  const sc=Math.min(118/(maxX-minX), 60/(maxY-minY))
  return (
    <div style={{ position:'absolute', bottom:8, right:8, width:130, height:80, background:'var(--s2)', border:'1px solid var(--b2)', borderRadius:8, overflow:'hidden', opacity:.9, zIndex:5, pointerEvents:'none' }}>
      <div style={{ fontSize:7, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', padding:'3px 5px', borderBottom:'1px solid var(--b1)' }}>Overview</div>
      <div style={{ position:'relative', height:64 }}>
        {nodes.map(r => {
          const mx=(r.x-minX)*sc+6, my=(r.y-minY)*sc+2
          const isE=editingNodeId===r.id
          return (
            <div key={r.id} style={{ position:'absolute', left:mx, top:my, width:NODE_W*sc, height:10, background:r.color+(isE?'':'55'), borderRadius:2, boxShadow:isE?'0 0 0 1px #fff':'none' }}>
              {r.isRoot && <div style={{ fontSize:4, color:'#fff', fontWeight:900, padding:1 }}>R</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NODE CONFIG PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function NodeConfigPanel({ node, allNodes, edges, onChange, onClose, onDelete, onDuplicate, onOpenEditor, onConnect, onDisconnect }) {
  const connectedTo = edges.filter(e=>e.from.id===node.id).map(e=>e.to.id)
  const canConn     = allNodes.filter(n=>n.id!==node.id&&!connectedTo.includes(n.id))

  function addCP() {
    onChange({choicePoints:[...(node.choicePoints||[]),{id:mkId(),triggerAt:60,question:'What would you like to do next?',subtitle:'Choose your path',choices:[]}]})
  }
  function removeCP(id) { onChange({choicePoints:(node.choicePoints||[]).filter(c=>c.id!==id)}) }
  function updateCP(id,patch) { onChange({choicePoints:(node.choicePoints||[]).map(c=>c.id===id?{...c,...patch}:c)}) }
  function addChoice(cpId) {
    onChange({choicePoints:(node.choicePoints||[]).map(cp=>cp.id===cpId?{
      ...cp,choices:[...(cp.choices||[]),{id:mkId(),label:`Option ${(cp.choices?.length||0)+1}`,icon:'▶',color:node.color,targetId:null}]
    }:cp)})
  }
  function updateChoice(cpId,chId,patch) {
    onChange({choicePoints:(node.choicePoints||[]).map(cp=>cp.id===cpId?{
      ...cp,choices:(cp.choices||[]).map(ch=>ch.id===chId?{...ch,...patch}:ch)
    }:cp)})
  }
  function removeChoice(cpId,chId) {
    onChange({choicePoints:(node.choicePoints||[]).map(cp=>cp.id===cpId?{
      ...cp,choices:(cp.choices||[]).filter(ch=>ch.id!==chId)
    }:cp)})
  }

  const Inp = ({val,onChg,ph=''}) => (
    <input value={val||''} onChange={e=>onChg(e.target.value)} placeholder={ph}
      style={{width:'100%',background:'var(--s4)',border:'1px solid var(--b2)',borderRadius:7,padding:'6px 9px',color:'var(--t1)',fontSize:11,boxSizing:'border-box',outline:'none',fontFamily:'inherit',marginBottom:6}}/>
  )

  return (
    <div className="node-config-panel" style={{ width:265, borderLeft:'1px solid var(--b1)', background:'var(--s1)', overflowY:'auto', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--b1)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:node.color, flexShrink:0 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{node.title}</div>
          <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>Configure node</div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--t3)', cursor:'pointer', padding:4, fontSize:18, lineHeight:1, fontFamily:'inherit' }}>✕</button>
      </div>

      <div style={{ padding:14, flex:1, overflowY:'auto' }}>
        {/* Open elements editor */}
        <button onClick={onOpenEditor} style={{ width:'100%', padding:9, borderRadius:9, background:'rgba(79,110,247,.1)', border:'1px solid rgba(79,110,247,.3)', color:'var(--acc)', fontSize:12, fontWeight:700, cursor:'pointer', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'inherit' }}>
          ⚡ Open Elements Editor
        </button>

        {/* isRoot */}
        <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, cursor:'pointer' }}>
          <div className={`toggle-sw ${node.isRoot?'on':''}`} onClick={()=>onChange({isRoot:!node.isRoot})}>
            <div className="knob"/>
          </div>
          <span style={{ fontSize:12, color:'var(--t2)' }}>This is the START video</span>
        </label>

        {/* Color */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--t3)', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>NODE COLOR</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => onChange({color:c})}
                style={{ width:22, height:22, borderRadius:'50%', background:c, cursor:'pointer', border:`2px solid ${node.color===c?'#fff':'transparent'}`, boxShadow:node.color===c?`0 0 6px ${c}80`:'none', transition:'all .15s' }}/>
            ))}
          </div>
        </div>

        {/* Connect to */}
        {canConn.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--t3)', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>CONNECT TO</div>
            {canConn.slice(0,6).map(n => (
              <button key={n.id} onClick={() => onConnect(node.id, n.id)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'6px 9px', borderRadius:8, background:'var(--s3)', border:'1px solid var(--b2)', color:'var(--t1)', fontSize:11, cursor:'pointer', marginBottom:5, textAlign:'left', fontFamily:'inherit' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:n.color, flexShrink:0 }}/>
                <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</span>
                <span style={{ fontSize:10, color:'var(--acc)', flexShrink:0 }}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* Current connections */}
        {connectedTo.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--t3)', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>CONNECTIONS</div>
            {connectedTo.map(id => {
              const tn=allNodes.find(n=>n.id===id); if(!tn) return null
              return (
                <div key={id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 9px', borderRadius:8, background:'var(--s3)', border:'1px solid var(--b2)', marginBottom:5 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:tn.color, flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:11, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tn.title}</span>
                  <button onClick={() => onDisconnect(node.id, id)} style={{ fontSize:9, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0, fontFamily:'inherit' }}>✕</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Choice points */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--t3)', marginBottom:10, textTransform:'uppercase', letterSpacing:.5 }}>CHOICE POINTS</div>
          
          {/* Visual Timeline */}
          {(node.choicePoints||[]).length > 0 && (
            <div style={{ marginBottom:16, background:'var(--s3)', borderRadius:9, padding:'10px 12px' }}>
              <div style={{ fontSize:9, fontWeight:600, color:'var(--t2)', marginBottom:8 }}>Timeline ({fmt(node.duration)})</div>
              <div style={{ position:'relative', height:28, background:'var(--s4)', borderRadius:6, overflow:'hidden' }}>
                {/* Timeline markers */}
                {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                  <div key={pct} style={{
                    position:'absolute',
                    left:`${pct*100}%`,
                    top:0,
                    bottom:0,
                    width:1,
                    background:'var(--b2)',
                  }} />
                ))}
                {/* Choice point markers */}
                {(node.choicePoints||[]).map((cp, idx) => {
                  const pct = Math.min(((cp.triggerAt||0) / node.duration) * 100, 100)
                  return (
                    <div key={cp.id} style={{
                      position:'absolute',
                      left:`${pct}%`,
                      top:'50%',
                      transform:'translate(-50%, -50%)',
                      width:20,
                      height:20,
                      borderRadius:'50%',
                      background:node.color,
                      border:'2px solid var(--s3)',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      fontSize:8,
                      color:'#fff',
                      fontWeight:800,
                      boxShadow:`0 0 8px ${node.color}60`,
                    }}>
                      {idx + 1}
                    </div>
                  )
                })}
              </div>
              {/* Time labels */}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:8, color:'var(--t3)' }}>
                <span>0:00</span>
                <span>{fmt(node.duration * 0.25)}</span>
                <span>{fmt(node.duration * 0.5)}</span>
                <span>{fmt(node.duration * 0.75)}</span>
                <span>{fmt(node.duration)}</span>
              </div>
            </div>
          )}

          {(node.choicePoints||[]).map(cp => (
            <div key={cp.id} style={{ background:'var(--s3)', borderRadius:9, padding:10, marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                <span style={{ fontSize:10, fontWeight:600, color:'var(--t2)' }}>Fires at {fmt(cp.triggerAt||0)}</span>
                <button onClick={() => removeCP(cp.id)} style={{ fontSize:9, color:'var(--red)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Remove</button>
              </div>
              <Inp val={cp.question} onChg={v=>updateCP(cp.id,{question:v})} ph="Question text..."/>
              <input type="number" value={cp.triggerAt||0} min={0} onChange={e=>updateCP(cp.id,{triggerAt:+e.target.value})}
                style={{ width:'100%', background:'var(--s4)', border:'1px solid var(--b2)', borderRadius:7, padding:'6px 9px', color:'var(--t1)', fontSize:11, marginBottom:7, boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}/>
              {(cp.choices||[]).map(ch => (
                <div key={ch.id} style={{ background:'var(--s2)', borderRadius:7, padding:8, marginBottom:6 }}>
                  <div style={{ display:'flex', gap:5, marginBottom:5 }}>
                    <input value={ch.icon||''} onChange={e=>updateChoice(cp.id,ch.id,{icon:e.target.value})}
                      style={{ width:32, background:'var(--s3)', border:'1px solid var(--b2)', borderRadius:6, padding:'5px 4px', color:'var(--t1)', fontSize:13, textAlign:'center', boxSizing:'border-box', outline:'none' }}/>
                    <input value={ch.label||''} onChange={e=>updateChoice(cp.id,ch.id,{label:e.target.value})} placeholder="Label"
                      style={{ flex:1, background:'var(--s3)', border:'1px solid var(--b2)', borderRadius:6, padding:'5px 8px', color:'var(--t1)', fontSize:11, boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}/>
                    <button onClick={()=>removeChoice(cp.id,ch.id)} style={{ fontSize:11, color:'var(--red)', background:'none', border:'none', cursor:'pointer', padding:'0 4px', flexShrink:0, fontFamily:'inherit' }}>✕</button>
                  </div>
                  <select value={ch.targetId||''} onChange={e=>updateChoice(cp.id,ch.id,{targetId:e.target.value})}
                    style={{ width:'100%', background:'var(--s3)', border:'1px solid var(--b2)', borderRadius:6, padding:'5px 8px', color:'var(--t1)', fontSize:10, boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}>
                    <option value="">Select target video...</option>
                    {allNodes.filter(n=>n.id!==node.id).map(n=><option key={n.id} value={n.id}>{n.title}</option>)}
                  </select>
                </div>
              ))}
              <DashedBtn onClick={() => addChoice(cp.id)}>+ Add Choice</DashedBtn>
            </div>
          ))}
          <DashedBtn onClick={addCP}>+ Add Choice Point</DashedBtn>
        </div>

        <div style={{ borderTop:'1px solid var(--b1)', paddingTop:14, display:'flex', gap:6 }}>
          <button onClick={onDuplicate} style={{ flex:1, padding:8, borderRadius:8, background:'var(--s3)', border:'1px solid var(--b2)', color:'var(--t2)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>⧉ Dupe</button>
          <button onClick={onDelete}    style={{ flex:1, padding:8, borderRadius:8, background:'rgba(255,107,107,.08)', border:'1px solid rgba(255,107,107,.25)', color:'var(--red)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TINY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function Modal({ children, onClose, zIndex=999 }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--s1)', border:'1px solid var(--b2)', borderRadius:16, padding:28, width:'100%', maxWidth:420, boxShadow:'0 24px 64px rgba(0,0,0,.5)', animation:'scaleIn .2s', margin:'0 16px' }}>
        {children}
      </div>
    </div>
  )
}

function DashedBtn({ onClick, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ width:'100%', padding:7, background:'transparent', border:`1px dashed ${hov?'var(--acc)':'var(--b2)'}`, borderRadius:8, color:hov?'var(--acc)':'var(--t3)', fontSize:11, cursor:'pointer', transition:'all .15s', fontFamily:'inherit', marginTop:4 }}>
      {children}
    </button>
  )
}