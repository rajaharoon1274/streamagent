'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/context/AuthContext'
import BuilderElementsEditor from './Builderelementseditor'
import RoutePreviewModal from './Routepreviewmodal'
import ShareDrawer from './ShareDrawer'

// ─── SWR fetcher ──────────────────────────────────────────────────────────────
const fetcher = url => fetch(url).then(r => {
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
})

// ─── Constants ────────────────────────────────────────────────────────────────
const NODE_W = 220
const NODE_H = 148
const COLORS = ['#4F6EF7', '#1ED8A0', '#F5A623', '#F06292', '#A855F7', '#FF6B6B', '#06B6D4', '#E879F9']
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const mkTmp = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

// ─── DB row → canvas node ─────────────────────────────────────────────────────
function dbToNode(r) {
  return {
    id: r.id,
    videoId: r.video_id || null,
    title: r.title || 'Untitled',
    color: r.color || '#4F6EF7',
    duration: r.duration || 240,
    x: r.x ?? 300,
    y: r.y ?? 180,
    isRoot: r.is_root || false,
    choicePoints: r.choice_points || [],
    routeGroup: r.route_group || (r.landing_page?.route_group) || 'default',
    rawLandingPage: r.landing_page || {},
  }
}

// ─── Edge helpers ─────────────────────────────────────────────────────────────
function getEdges(nodes) {
  const e = []
  nodes.forEach(n => {
    ; (n.choicePoints || []).forEach(cp => {
      ; (cp.choices || []).forEach(ch => {
        if (ch.targetId) {
          const t = nodes.find(x => x.id === ch.targetId)
          if (t) e.push({ from: n, to: t, choice: ch, cp })
        }
      })
    })
  })
  return e
}

// ─── Shared button styles ─────────────────────────────────────────────────────
const tbBtn = { padding: '5px 10px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }
const iconBtn = { width: 22, height: 22, borderRadius: 5, background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--t3)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'inherit' }

// ─── Mobile CSS ───────────────────────────────────────────────────────────────
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
  const { workspace } = useAuth()
  const workspaceId = workspace?.id || null

  // ── SWR ───────────────────────────────────────────────────────────────────
  const routesSWRKey = workspaceId ? `/api/routes?workspace_id=${workspaceId}` : null
  const { data: routesData, isLoading: routesLoading, mutate: mutateRoutes } = useSWR(
    routesSWRKey, fetcher, { revalidateOnFocus: false }
  )
  const { data: videosRaw } = useSWR(
    workspaceId ? `/api/videos?status=ready` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // ── Videos palette ────────────────────────────────────────────────────────
  const VIDEOS = (Array.isArray(videosRaw) ? videosRaw : []).map(v => ({
    id: v.id,
    title: v.title || 'Untitled',
    dur: v.duration_seconds ? fmt(v.duration_seconds) : '0:00',
    duration_seconds: v.duration_seconds || 0,
    views: v.views || 0,
    eng: v.eng || 0,
    color: v.color || '#4F6EF7',
    aspectRatio: v.aspect_ratio || '16:9',
  }))

  // ── ALL nodes ─────────────────────────────────────────────────────────────
  const [allNodes, setAllNodes] = useState([])
  const [nodesBooted, setNodesBooted] = useState(false)

  useEffect(() => {
    if (routesData?.routes && !nodesBooted) {
      const mapped = routesData.routes.map(dbToNode)
      allNodesRef.current = mapped
      setAllNodes(mapped)
      setNodesBooted(true)
      setSavedHash(JSON.stringify(mapped))

      // ── RECONSTRUCT route groups from DB data ──────────────────────
      // Each root node stores { route_group_name, ... } in landing_page JSONB
      const groupMap = {}
      mapped.forEach(n => {
        const groupId = n.routeGroup || 'default'
        if (!groupMap[groupId]) {
          // Try to get the human name from the root node's landing_page
          const rootOfGroup = mapped.find(x => (x.routeGroup || 'default') === groupId && x.isRoot)
          const savedName = rootOfGroup?.rawLandingPage?.route_group_name
          groupMap[groupId] = savedName || (groupId === 'default' ? 'My Route' : groupId)
        }
      })
      const reconstructed = Object.entries(groupMap).map(([id, name]) => ({ id, name }))
      if (reconstructed.length > 0) {
        setRouteGroups(reconstructed)
        setActiveGroupId(reconstructed[0].id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesData])

  // ── Named route groups ────────────────────────────────────────────────────
  const [routeGroups, setRouteGroups] = useState([{ id: 'default', name: 'My Route' }])
  const [activeGroupId, setActiveGroupId] = useState('default')

  const canvasNodes = allNodes.filter(n => (n.routeGroup || 'default') === activeGroupId)

  // ── Per-node state ────────────────────────────────────────────────────────
  const [selNodeId, setSelNodeId] = useState(null)
  const [editingNodeId, setEditingNodeId] = useState(null)
  const [routeEls, setRouteEls] = useState({})
  const [landingPages, setLandingPages] = useState({})

  // ── Canvas viewport ───────────────────────────────────────────────────────
  const [vp, setVp] = useState({ x: 60, y: 40 })
  const [scale, setScale] = useState(0.9)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [previewMode, setPreviewMode] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [folderOpen, setFolderOpen] = useState(false)
  const [libExpanded, setLibExpanded] = useState(false)
  const [newRouteModal, setNewRouteModal] = useState(false)
  const [newRouteName, setNewRouteName] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [unsavedModal, setUnsavedModal] = useState(false)
  const [pendingGroupId, setPendingGroupId] = useState(null)
  const [savedHash, setSavedHash] = useState('[]')
  const [saveFlash, setSaveFlash] = useState(false)
  const autoSaveRef = useRef(null)
  const patchTimers = useRef({})
  const elSaveTimers = useRef({})

  // ── Stable refs ───────────────────────────────────────────────────────────
  const canvasRef = useRef(null)
  const vpRef = useRef(vp)
  const scaleRef = useRef(scale)
  const allNodesRef = useRef(allNodes)
  vpRef.current = vp
  scaleRef.current = scale
  allNodesRef.current = allNodes

  // ── Mobile CSS ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById('builder-mobile-css')) return
    const s = document.createElement('style')
    s.id = 'builder-mobile-css'; s.textContent = MOBILE_CSS
    document.head.appendChild(s)
  }, [])

  // ── Derived ───────────────────────────────────────────────────────────────
  const edges = getEdges(canvasNodes)
  const editNode = editingNodeId ? canvasNodes.find(r => r.id === editingNodeId) : null
  const selNode = selNodeId ? canvasNodes.find(r => r.id === selNodeId) : null
  const hasUnsaved = savedHash !== JSON.stringify(allNodes)
  const usedVids = canvasNodes.map(r => r.videoId).filter(Boolean)
  const activeGroup = routeGroups.find(g => g.id === activeGroupId)

  // ── Share URL derivation ──────────────────────────────────────────────────
  // rootNodeForShare = the ENTRY node (isRoot=true) or first node on canvas
  const rootNodeForShare = canvasNodes.find(n => n.isRoot) || canvasNodes[0] || null
  // shareVideoId — the actual video id to send to /watch/[id]
  // Only set when node is saved to DB (not a temp_ id)
  const shareVideoId = (
    rootNodeForShare?.videoId &&
    rootNodeForShare?.id &&
    !rootNodeForShare.id.startsWith('tmp_')
  ) ? rootNodeForShare.videoId : null
  // slug — the node DB id, used as fallback for /r/[slug] embeds
  const slug = (rootNodeForShare?.id && !rootNodeForShare.id.startsWith('tmp_'))
    ? rootNodeForShare.id
    : null

  const filteredVids = (libExpanded ? VIDEOS : VIDEOS.slice(0, 6)).filter(v =>
    !search || v.title.toLowerCase().includes(search.toLowerCase())
  )

  // ── Sidebar route list ────────────────────────────────────────────────────
  const streamRoutes = routeGroups.map(g => {
    const gNodes = allNodes.filter(n => (n.routeGroup || 'default') === g.id)
    const gEdges = getEdges(gNodes)
    return { id: g.id, name: g.name, videos: gNodes.map(n => n.id), connections: gEdges.length }
  })

  // ══════════════════════════════════════════════════════════════════════════
  // API HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  async function apiCreate(payload) {
    const res = await fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId, ...payload }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Create failed')
    return json.route
  }

  function apiPatch(id, patch) {
    if (!id || id.startsWith('tmp_')) return
    clearTimeout(patchTimers.current[id])
    patchTimers.current[id] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/routes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          console.error('[Builder PATCH]', j.error)
        }
      } catch (e) { console.error('[Builder PATCH]', e) }
    }, 800)
  }

  async function apiDelete(id) {
    if (!id || id.startsWith('tmp_')) return
    const res = await fetch(`/api/routes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Delete failed')
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ELEMENTS — save to DB + load from DB
  // ══════════════════════════════════════════════════════════════════════════

  async function saveElementsToDB(nodeId, els) {
    const node = allNodesRef.current.find(n => n.id === nodeId)
    if (!node?.videoId) return
    try {
      const res = await fetch('/api/elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: node.videoId, elements: els }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        console.error('[Builder] Save elements failed:', j.error)
      }
    } catch (e) {
      console.error('[Builder] Save elements error:', e)
    }
  }
  
  function handleElChange(nodeId, newEls) {
    setRouteEls(prev => ({ ...prev, [nodeId]: newEls }))
    scheduleAutoSave()
    clearTimeout(elSaveTimers.current[nodeId])
    elSaveTimers.current[nodeId] = setTimeout(() => {
      saveElementsToDB(nodeId, newEls)
    }, 1500)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTO-SAVE
  // ══════════════════════════════════════════════════════════════════════════

  function scheduleAutoSave() {
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      setSavedHash(JSON.stringify(allNodesRef.current))
      setSaveFlash('auto')
      setTimeout(() => setSaveFlash(false), 2500)
    }, 3000)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WHEEL ZOOM
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const el = canvasRef.current; if (!el) return
    const handler = e => {
      e.preventDefault()
      const d = e.deltaY > 0 ? -0.08 : 0.08
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
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // ══════════════════════════════════════════════════════════════════════════
  // CANVAS PAN
  // ══════════════════════════════════════════════════════════════════════════

  function onCanvasMouseDown(e) {
    const t = e.target
    const isBg = t === canvasRef.current || ['svg', 'path', 'polygon', 'text', 'g'].includes(t.tagName)
    if (!isBg) return
    const sx = e.clientX - vpRef.current.x, sy = e.clientY - vpRef.current.y
    const mv = me => { const nv = { x: me.clientX - sx, y: me.clientY - sy }; vpRef.current = nv; setVp({ ...nv }) }
    const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up)
  }

  function onCanvasTouchStart(e) {
    if (e.touches.length !== 1) return
    const t = e.target
    if (t !== canvasRef.current && t.tagName !== 'svg') return
    const tc = e.touches[0]
    const sx = tc.clientX - vpRef.current.x, sy = tc.clientY - vpRef.current.y
    const mv = me => {
      if (me.touches.length !== 1) return
      const tt = me.touches[0]
      const nv = { x: tt.clientX - sx, y: tt.clientY - sy }
      vpRef.current = nv; setVp({ ...nv })
    }
    const up = () => { document.removeEventListener('touchmove', mv); document.removeEventListener('touchend', up) }
    document.addEventListener('touchmove', mv, { passive: false })
    document.addEventListener('touchend', up)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NODE DRAG
  // ══════════════════════════════════════════════════════════════════════════

  function onNodeMouseDown(e, id) {
    if (e.button !== 0) return
    e.stopPropagation()
    setSelNodeId(id)
    const node = allNodesRef.current.find(r => r.id === id); if (!node) return
    const sx = e.clientX - node.x * scaleRef.current
    const sy = e.clientY - node.y * scaleRef.current
    const stX = e.clientX, stY = e.clientY
    let moved = false
    const mv = me => {
      if (!moved && Math.abs(me.clientX - stX) < 5 && Math.abs(me.clientY - stY) < 5) return
      moved = true
      node.x = (me.clientX - sx) / scaleRef.current
      node.y = (me.clientY - sy) / scaleRef.current
      const el = document.getElementById('bn-' + id)
      if (el) { el.style.left = node.x + 'px'; el.style.top = node.y + 'px' }
    }
    const up = () => {
      document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up)
      if (moved) {
        setAllNodes([...allNodesRef.current])
        scheduleAutoSave()
        apiPatch(id, { x: Math.round(node.x), y: Math.round(node.y) })
      }
    }
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PALETTE DRAG → POST to DB on drop
  // ══════════════════════════════════════════════════════════════════════════

  function onPaletteMouseDown(e, videoId) {
    if (e.button !== 0) return
    e.preventDefault(); e.stopPropagation()
    const v = VIDEOS.find(x => x.id === videoId); if (!v) return
    const ghost = document.createElement('div')
    ghost.style.cssText = `position:fixed;pointer-events:none;z-index:99999;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.5);width:160px;opacity:.92;left:${e.clientX - 80}px;top:${e.clientY - 30}px`
    ghost.innerHTML = `<div style="height:44px;background:${v.color};display:flex;align-items:center;justify-content:center"><div style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;font-size:9px">▶</div></div><div style="background:#0C0F1C;padding:7px 9px;border:1px solid ${v.color}44;border-top:none;border-radius:0 0 10px 10px"><div style="font-size:11px;font-weight:700;color:#EEF2FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v.title}</div><div style="font-size:9px;color:#7B87A0;margin-top:2px">${v.dur}</div></div>`
    document.body.appendChild(ghost)
    const canvas = canvasRef.current
    if (canvas) canvas.style.outline = `2px dashed ${v.color}88`
    const mv = me => {
      ghost.style.left = (me.clientX - 80) + 'px'; ghost.style.top = (me.clientY - 30) + 'px'
      if (canvas) {
        const rc = canvas.getBoundingClientRect()
        const over = me.clientX >= rc.left && me.clientX <= rc.right && me.clientY >= rc.top && me.clientY <= rc.bottom
        canvas.style.outline = over ? `2px solid ${v.color}` : `2px dashed ${v.color}88`
        ghost.style.opacity = over ? '1' : '0.75'
      }
    }
    const up = me => {
      ghost.parentNode?.removeChild(ghost)
      if (canvas) canvas.style.outline = ''
      document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up)
      if (!canvas) return
      const rc = canvas.getBoundingClientRect()
      const on = me.clientX >= rc.left && me.clientX <= rc.right && me.clientY >= rc.top && me.clientY <= rc.bottom
      if (on) {
        const x = (me.clientX - rc.left - vpRef.current.x) / scaleRef.current - NODE_W / 2
        const y = (me.clientY - rc.top - vpRef.current.y) / scaleRef.current - NODE_H / 2
        addNode(videoId, Math.max(0, x), Math.max(0, y))
      }
    }
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NODE CRUD
  // ══════════════════════════════════════════════════════════════════════════

  async function addNode(videoId, x, y) {
    if (!workspaceId) return
    const v = VIDEOS.find(xv => xv.id === videoId); if (!v) return
    const gNodes = allNodesRef.current.filter(n => (n.routeGroup || 'default') === activeGroupId)
    const isFirst = gNodes.length === 0
    const nx = x ?? 100 + gNodes.length * 40
    const ny = y ?? 100 + gNodes.length * 30

    const tempId = mkTmp()
    const tempNode = {
      id: tempId, videoId: v.id, title: v.title, color: v.color,
      duration: v.duration_seconds || 240, x: nx, y: ny,
      isRoot: isFirst, choicePoints: [], routeGroup: activeGroupId, _saving: true,
    }
    const withTemp = [...allNodesRef.current, tempNode]
    allNodesRef.current = withTemp; setAllNodes(withTemp)

    try {
      const saved = await apiCreate({
        video_id: v.id,
        title: v.title,
        color: v.color,
        x: Math.round(nx),
        y: Math.round(ny),
        is_root: isFirst,
        duration: v.duration_seconds || 240,
        route_group: activeGroupId,
        landing_page: {
          route_group: activeGroupId,
          route_group_name: activeGroup?.name || 'My Route',
        },
      })

      const realNode = { ...dbToNode(saved), routeGroup: activeGroupId }
      const withReal = allNodesRef.current.map(n => n.id === tempId ? realNode : n)
      allNodesRef.current = withReal; setAllNodes(withReal)
      setSelNodeId(realNode.id)
      scheduleAutoSave()
      mutateRoutes()
    } catch (err) {
      console.error('[addNode]', err)
      const without = allNodesRef.current.filter(n => n.id !== tempId)
      allNodesRef.current = without; setAllNodes(without)
    }
  }

  async function removeNode(id) {
    const prev = allNodesRef.current
    const nr = prev
      .filter(r => r.id !== id)
      .map(r => ({
        ...r,
        choicePoints: (r.choicePoints || [])
          .map(cp => ({ ...cp, choices: (cp.choices || []).filter(ch => ch.targetId !== id) }))
          .filter(cp => (cp.choices || []).length > 0)
      }))
    allNodesRef.current = nr; setAllNodes(nr)
    if (selNodeId === id) setSelNodeId(null)
    if (editingNodeId === id) setEditingNodeId(null)
    scheduleAutoSave()
    try {
      await apiDelete(id)
      nr.forEach(n => {
        const orig = prev.find(p => p.id === n.id)
        if (orig && JSON.stringify(orig.choicePoints) !== JSON.stringify(n.choicePoints)) {
          apiPatch(n.id, { choice_points: n.choicePoints })
        }
      })
      mutateRoutes()
    } catch (err) {
      console.error('[removeNode]', err)
      allNodesRef.current = prev; setAllNodes(prev)
    }
  }

  const updateNode = useCallback((id, patch) => {
    setAllNodes(prev => {
      const nr = prev.map(r => r.id === id ? { ...r, ...patch } : r)
      allNodesRef.current = nr
      scheduleAutoSave()
      const dbPatch = {}
      if ('choicePoints' in patch) dbPatch.choice_points = patch.choicePoints
      if ('isRoot' in patch) dbPatch.is_root = patch.isRoot
      if ('color' in patch) dbPatch.color = patch.color
      if ('title' in patch) dbPatch.title = patch.title
      if ('duration' in patch) dbPatch.duration = patch.duration
      if ('x' in patch) dbPatch.x = patch.x
      if ('y' in patch) dbPatch.y = patch.y
      if (Object.keys(dbPatch).length) apiPatch(id, dbPatch)
      return nr
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function duplicateNode(id) {
    const n = allNodesRef.current.find(r => r.id === id); if (!n) return
    addNode(n.videoId, n.x + 30, n.y + 30)
  }

  function quickConnect(fromId, toId) {
    const f = allNodesRef.current.find(r => r.id === fromId)
    const t = allNodesRef.current.find(r => r.id === toId)
    if (!f || !t) return
    if ((f.choicePoints || []).some(cp => (cp.choices || []).some(ch => ch.targetId === toId))) return
    updateNode(fromId, {
      choicePoints: [...(f.choicePoints || []), {
        id: `cp_${Date.now()}`, triggerAt: 60, question: 'What would you like to do next?', subtitle: 'Choose your path',
        choices: [{ id: `ch_${Date.now()}`, label: t.title, icon: '▶', color: t.color || '#4F6EF7', targetId: toId }]
      }]
    })
  }

  function disconnectNodes(fromId, toId) {
    const f = allNodesRef.current.find(r => r.id === fromId); if (!f) return
    updateNode(fromId, {
      choicePoints: (f.choicePoints || []).map(cp => ({
        ...cp, choices: (cp.choices || []).filter(ch => ch.targetId !== toId)
      })).filter(cp => (cp.choices || []).length > 0)
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTO-LAYOUT BFS
  // ══════════════════════════════════════════════════════════════════════════

  function autoLayout() {
    const es = getEdges(canvasNodes)
    const root = canvasNodes.find(r => r.isRoot) || canvasNodes[0]
    if (!root) return
    const levels = { [root.id]: 0 }, queue = [root.id], visited = { [root.id]: true }
    while (queue.length) {
      const cur = queue.shift()
      es.filter(e => e.from.id === cur).forEach(e => {
        if (!visited[e.to.id]) { visited[e.to.id] = true; levels[e.to.id] = (levels[cur] || 0) + 1; queue.push(e.to.id) }
      })
    }
    canvasNodes.forEach(r => { if (levels[r.id] === undefined) levels[r.id] = 0 })
    const byLv = {}
    canvasNodes.forEach(r => { const lv = levels[r.id] || 0; if (!byLv[lv]) byLv[lv] = []; byLv[lv].push(r) })
    const nr = allNodesRef.current.map(r => ({ ...r }))
    Object.keys(byLv).sort((a, b) => +a - +b).forEach(lv => {
      let x = 80; byLv[lv].forEach(n => { const nd = nr.find(r => r.id === n.id); if (nd) { nd.x = x; nd.y = 60 + (+lv) * 220 }; x += 290 })
    })
    allNodesRef.current = nr; setAllNodes([...nr]); setVp({ x: 0, y: 0 }); setScale(0.9)
    nr.filter(n => (n.routeGroup || 'default') === activeGroupId)
      .forEach(n => apiPatch(n.id, { x: Math.round(n.x), y: Math.round(n.y) }))
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FIT SCREEN
  // ═══════════════════════════════════════════════════════════════════════���══

  function fitScreen() {
    if (!canvasNodes.length) return
    const xs = canvasNodes.map(r => r.x), ys = canvasNodes.map(r => r.y)
    const minX = Math.min(...xs) - 40, minY = Math.min(...ys) - 40
    const maxX = Math.max(...xs) + NODE_W + 40, maxY = Math.max(...ys) + NODE_H + 40
    const canvas = canvasRef.current
    const cw = canvas ? canvas.clientWidth : 800, ch = canvas ? canvas.clientHeight : 500
    const sc = +Math.min(cw / (maxX - minX), ch / (maxY - minY), 1.4).toFixed(2)
    const nv = { x: -minX * sc + 20, y: -minY * sc + 20 }
    scaleRef.current = sc; vpRef.current = nv; setScale(sc); setVp(nv)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SAVE
  // ══════════════════════════════════════════════════════════════════════════

  function saveRoute() {
    clearTimeout(autoSaveRef.current)
    setSavedHash(JSON.stringify(allNodesRef.current))
    setSaveFlash('saved')
    setTimeout(() => setSaveFlash(false), 2500)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ROUTE GROUP MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  function tryLoadRoute(groupId) {
    if (hasUnsaved) { setPendingGroupId(groupId); setUnsavedModal(true); return }
    doLoad(groupId)
  }

  function doLoad(groupId) {
    setActiveGroupId(groupId)
    setSelNodeId(null); setEditingNodeId(null)
    setVp({ x: 60, y: 40 }); setScale(0.9); setSidebarOpen(false)
  }

  function confirmNewRoute() {
    if (!newRouteName.trim()) return
    const newId = `grp_${newRouteName.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
    setRouteGroups(prev => [...prev, { id: newId, name: newRouteName.trim() }])
    setActiveGroupId(newId)
    setSelNodeId(null); setEditingNodeId(null)
    setVp({ x: 60, y: 40 }); setScale(0.9)
    setNewRouteName(''); setNewRouteModal(false)
  }

  function deleteRouteGroup(groupId) {
    allNodesRef.current
      .filter(n => (n.routeGroup || 'default') === groupId)
      .forEach(n => apiDelete(n.id).catch(() => { }))
    const remaining = allNodesRef.current.filter(n => (n.routeGroup || 'default') !== groupId)
    allNodesRef.current = remaining; setAllNodes(remaining)
    setRouteGroups(prev => prev.filter(g => g.id !== groupId))
    if (activeGroupId === groupId) {
      const first = routeGroups.find(g => g.id !== groupId)
      setActiveGroupId(first?.id || 'default')
    }
    setSelNodeId(null); setEditingNodeId(null)
    mutateRoutes()
  }

  function dupRouteGroup(groupId) {
    const srcNodes = allNodesRef.current.filter(n => (n.routeGroup || 'default') === groupId)
    const newGroupId = `grp_${Date.now()}`
    const srcGroup = routeGroups.find(g => g.id === groupId)
    setRouteGroups(prev => [...prev, { id: newGroupId, name: (srcGroup?.name || 'Route') + ' (copy)' }])
    srcNodes.forEach(n => addNodeDirect(n.videoId, n.x + 20, n.y + 20, newGroupId))
  }

  async function addNodeDirect(videoId, x, y, groupId) {
    if (!workspaceId) return
    const v = VIDEOS.find(xv => xv.id === videoId); if (!v) return
    try {
      const saved = await apiCreate({
        video_id: v.id, title: v.title, color: v.color,
        x: Math.round(x), y: Math.round(y), is_root: false,
        duration: v.duration_seconds || 240,
      })
      const realNode = { ...dbToNode(saved), routeGroup: groupId }
      const nr = [...allNodesRef.current, realNode]
      allNodesRef.current = nr; setAllNodes(nr)
    } catch (err) { console.error('[addNodeDirect]', err) }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ELEMENTS EDITOR — open + load from DB
  // ══════════════════════════════════════════════════════════════════════════

  async function openEditor(id) {
    if (editingNodeId === id) { setEditingNodeId(null); return }
    setEditingNodeId(id); setSelNodeId(null); setSidebarOpen(false)

    if (!routeEls[id]) {
      const node = allNodesRef.current.find(n => n.id === id)
      if (node?.videoId) {
        try {
          const res = await fetch(`/api/elements?video_id=${node.videoId}`)
          if (res.ok) {
            const data = await res.json()
            const mapped = (Array.isArray(data) ? data : []).map(el => ({
              id: el.id,
              type: el.type,
              props: el.props || {},
              xPct: el.x ?? 10,
              yPct: el.y ?? 10,
              wPct: el.w ?? 40,
              hPct: el.h ?? 25,
              timing: el.timing || { mode: 'at-time', in: 0, duration: 5, animIn: 'fadeIn', animOut: 'fadeOut', animSpeed: '0.4', trigger: 'time' },
              gate: el.gate || { enabled: false },
              conditions: el.conditions || [],
              opacity: el.opacity ?? 1,
              zIndex: el.z_index ?? 1,
            }))
            setRouteEls(prev => ({ ...prev, [id]: mapped }))
          }
        } catch (e) {
          console.error('[Builder] Load elements error:', e)
          setRouteEls(prev => ({ ...prev, [id]: [] }))
        }
      } else {
        setRouteEls(prev => ({ ...prev, [id]: [] }))
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PREVIEW
  // ══════════════════════════════════════════════════════════════════════════

  function openPreview(mode) {
    const rootNode = canvasNodes.find(n => n.isRoot) || canvasNodes[0]
    if (rootNode?.videoId) {
      window.open(`/watch/${rootNode.videoId}?route_node=${rootNode.id}`, '_blank')
    } else {
      setPreviewMode(mode)
    }
  }

  // ── Save button display ───────────────────────────────────────────────────
  const saveLabel = saveFlash === 'saved' ? '✓ Saved' : saveFlash === 'auto' ? '✓ Auto-saved' : hasUnsaved ? '● Save' : '✓ Saved'
  const saveBg = hasUnsaved && !saveFlash ? 'var(--acc)' : 'var(--s3)'
  const saveColor = hasUnsaved && !saveFlash ? '#fff' : saveFlash ? 'var(--grn)' : 'var(--t2)'
  const saveBorder = hasUnsaved && !saveFlash ? 'var(--acc)' : saveFlash ? 'var(--grn)' : 'var(--b2)'

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', flexDirection: 'column', fontFamily: "'Outfit',-apple-system,sans-serif" }}>

      {/* ════ TOOLBAR ════ */}
      <div className="builder-toolbar" style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 5, flexShrink: 0, height: 46, overflow: 'hidden' }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', whiteSpace: 'nowrap', flexShrink: 0 }}>Route Builder</span>
        <div style={{ width: 1, height: 18, background: 'var(--b2)', flexShrink: 0, marginRight: 1 }} />

        <button onClick={() => setNewRouteModal(true)} style={{ padding: '5px 12px', borderRadius: 8, background: 'linear-gradient(135deg,rgba(79,110,247,.15),rgba(168,85,247,.15))', border: '1px solid rgba(79,110,247,.4)', color: '#a78bfa', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>
          + New Route
        </button>

        <button onClick={fitScreen} style={tbBtn}>⤢ <span className="tb-label">Fit</span></button>
        <button onClick={autoLayout} style={tbBtn}>⊞ <span className="tb-label">Auto-Layout</span></button>
        <button onClick={() => openPreview('desktop')} style={{ ...tbBtn, background: 'var(--s3)' }}>▶ <span className="tb-label">Preview</span></button>
        <button onClick={() => openPreview('mobile')} style={{ ...tbBtn }}>📱</button>

        <div style={{ flex: 1 }} />

        {routesLoading && <span style={{ fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap', flexShrink: 0 }}>Loading…</span>}

        <span style={{ fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap', flexShrink: 0, marginRight: 2 }}>
          {canvasNodes.length} vid{canvasNodes.length !== 1 ? 's' : ''} · {edges.length} conn
        </span>

        <button onClick={() => setScale(s => Math.max(0.25, +(s - 0.1).toFixed(2)))} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--s3)', border: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--t2)', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>−</button>
        <span style={{ fontSize: 10, color: 'var(--t2)', fontFamily: 'monospace', width: 34, textAlign: 'center', flexShrink: 0 }}>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(2, +(s + 0.1).toFixed(2)))} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--s3)', border: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--t2)', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>+</button>

        <button onClick={saveRoute} style={{ ...tbBtn, background: saveBg, border: `1px solid ${saveBorder}`, color: saveColor, fontWeight: 700, transition: 'all .3s' }}>
          {saveLabel}
        </button>

        {canvasNodes.length > 0 && (
          <button onClick={() => { if (window.confirm('Delete all nodes in this route?')) deleteRouteGroup(activeGroupId) }}
            style={{ ...tbBtn, background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.25)', color: 'var(--red)' }}>
            Delete
          </button>
        )}

        <button onClick={() => setShareOpen(!shareOpen)}
          style={{ padding: '5px 12px', borderRadius: 7, background: 'var(--acc)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>
          Share
        </button>
      </div>

      {/* ════ BODY ════ */}
      <div className={sidebarOpen ? 'builder-sidebar-open' : ''} style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div className="builder-sidebar" style={{ width: 210, background: 'var(--s1)', borderRight: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

          {/* ── StreamRoutes folder ── */}
          <div style={{ borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
            <div style={{ padding: '10px 12px 6px', fontSize: 11, fontWeight: 700, color: 'var(--t1)' }}>StreamRoutes</div>
            <div style={{ padding: '0 10px 8px' }}>
              {(folderOpen ? streamRoutes : streamRoutes.slice(0, 4)).map(sr => (
                <div key={sr.id} onClick={() => tryLoadRoute(sr.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', borderRadius: 9, marginBottom: 3, cursor: 'pointer', background: activeGroupId === sr.id ? 'rgba(79,110,247,.12)' : 'var(--s3)', border: `1px solid ${activeGroupId === sr.id ? 'rgba(79,110,247,.3)' : 'var(--b2)'}`, transition: 'border-color .15s' }}>
                  <span style={{ fontSize: 13 }}>📁</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: activeGroupId === sr.id ? 'var(--acc)' : 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sr.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--t3)' }}>{sr.videos.length} vids · {sr.connections} conn</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); dupRouteGroup(sr.id) }} title="Dup" style={iconBtn}>⧉</button>
                  <button onClick={e => { e.stopPropagation(); if (window.confirm('Delete this route?')) deleteRouteGroup(sr.id) }} title="Del" style={{ ...iconBtn, background: 'rgba(255,107,107,.06)', border: '1px solid rgba(255,107,107,.2)', color: 'var(--red)' }}>✕</button>
                  {activeGroupId === sr.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--acc)', flexShrink: 0 }} />}
                </div>
              ))}
              {streamRoutes.length > 4 && (
                <button onClick={() => setFolderOpen(!folderOpen)} style={{ width: '100%', padding: '5px 8px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t3)', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginTop: 3, fontFamily: 'inherit' }}>
                  {folderOpen ? '▲ Show less' : `▼ ${streamRoutes.length - 4} more routes`}
                </button>
              )}
            </div>
          </div>

          {/* ── Video Library ── */}
          <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Video Library</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 7, padding: '5px 8px', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>🔍</span>
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: 10, color: 'var(--t1)', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ fontSize: 9, color: 'var(--t3)' }}>Drag onto canvas · Double-click to add</div>
          </div>

          <div style={{ overflowY: 'auto', padding: 10, flex: 1 }}>
            {!videosRaw && (
              <div style={{ textAlign: 'center', padding: '20px 8px', color: 'var(--t3)', fontSize: 10 }}>Loading videos…</div>
            )}
            {videosRaw && VIDEOS.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 8px', color: 'var(--t3)', fontSize: 10, lineHeight: 1.7 }}>
                No ready videos yet.<br />Upload &amp; process a video first.
              </div>
            )}
            {filteredVids.map(v => {
              const inUse = usedVids.includes(v.id)
              const isEdit = editingNodeId && canvasNodes.find(r => r.videoId === v.id)?.id === editingNodeId
              return (
                <div key={v.id}
                  onMouseDown={e => onPaletteMouseDown(e, v.id)}
                  onDoubleClick={() => addNode(v.id)}
                  style={{ borderRadius: 10, marginBottom: 7, overflow: 'hidden', cursor: 'grab', border: `1.5px solid ${isEdit ? v.color : inUse ? v.color + '44' : 'var(--b2)'}`, background: 'var(--bg)', transition: 'all .15s', userSelect: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = v.color + '99'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isEdit ? v.color : inUse ? v.color + '44' : 'var(--b2)'; e.currentTarget.style.boxShadow = '' }}>
                  <div style={{ height: 44, background: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>▶</div>
                    {isEdit && <div style={{ position: 'absolute', top: 3, left: 4, fontSize: 8, fontWeight: 800, color: '#fff', background: v.color, padding: '1px 5px', borderRadius: 3 }}>EDITING</div>}
                    {!isEdit && inUse && <div style={{ position: 'absolute', top: 3, left: 4, fontSize: 8, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,.45)', padding: '1px 5px', borderRadius: 3 }}>ON CANVAS</div>}
                    <div style={{ position: 'absolute', bottom: 3, right: 5, fontSize: 8, color: '#fff', background: 'rgba(0,0,0,.5)', padding: '1px 4px', borderRadius: 3 }}>{v.dur}</div>
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                    <div style={{ fontSize: 8, color: 'var(--t3)' }}>{v.eng}% engagement</div>
                  </div>
                </div>
              )
            })}
            {VIDEOS.length > 6 && (
              <div onClick={() => setLibExpanded(!libExpanded)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 8, marginTop: 4, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--b2)', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: 'var(--t2)' }}>
                {libExpanded ? '↑ Show less' : `↓ ${VIDEOS.length - 6} more videos`}
              </div>
            )}
          </div>
        </div>

        {/* Mobile overlay + toggle */}
        {sidebarOpen && (
          <div className="builder-sidebar-overlay" onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 54 }} />
        )}
        <button className="builder-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ display: 'none', position: 'fixed', bottom: 72, left: 12, zIndex: 60, padding: '8px 14px', borderRadius: 10, background: 'var(--acc)', color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(79,110,247,.4)', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
          🎬 Videos
        </button>

        {/* ══ CANVAS + ELEMENTS EDITOR ══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* ── Main canvas ── */}
          <div id="builder-canvas" ref={canvasRef}
            onMouseDown={onCanvasMouseDown}
            onTouchStart={onCanvasTouchStart}
            onClick={e => {
              if (e.target === canvasRef.current || e.target.tagName === 'svg') {
                setSelNodeId(null)
                if (editingNodeId) setEditingNodeId(null)
              }
            }}
            style={{
              ...(editNode ? { height: 220, flexShrink: 0 } : { flex: 1 }),
              overflow: 'hidden', position: 'relative', cursor: 'default',
              backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.09) 1px,transparent 1px)',
              backgroundSize: `${24 * scale}px ${24 * scale}px`,
              backgroundPosition: `${vp.x}px ${vp.y}px`,
            }}>

            <div style={{ position: 'absolute', transform: `translate(${vp.x}px,${vp.y}px) scale(${scale})`, transformOrigin: '0 0' }}>

              {/* SVG edges */}
              <svg style={{ position: 'absolute', overflow: 'visible', top: 0, left: 0, width: 1, height: 1, pointerEvents: 'none' }}>
                {edges.map(e => {
                  const x1 = e.from.x + NODE_W / 2, y1 = e.from.y + NODE_H
                  const x2 = e.to.x + NODE_W / 2, y2 = e.to.y
                  const mY = (y1 + y2) / 2, mX = (x1 + x2) / 2
                  const c = e.choice.color || e.from.color || '#4F6EF7'
                  const labelText = `${e.choice.icon || ''} ${(e.choice.label || '').slice(0, 10)}`
                  return (
                    <g key={`${e.from.id}-${e.to.id}-${e.choice.id}`}>
                      <path d={`M${x1},${y1} C${x1},${mY} ${x2},${mY} ${x2},${y2}`} fill="none" stroke={`${c}66`} strokeWidth={2} strokeDasharray="5,4" />
                      <polygon points={`${x2},${y2} ${x2 - 5},${y2 - 8} ${x2 + 5},${y2 - 8}`} fill={c} opacity={0.85} />
                      <g transform={`translate(${mX},${mY})`}>
                        <rect x="-34" y="-11" width="68" height="22" rx="11" fill={`${c}22`} stroke={`${c}55`} strokeWidth={1} />
                        <text textAnchor="middle" dominantBaseline="middle" fill={c} fontSize={9} fontWeight={700} fontFamily="'Outfit',sans-serif">{labelText}</text>
                      </g>
                    </g>
                  )
                })}
              </svg>

              {/* Node cards */}
              {canvasNodes.map(node => {
                const isSel = selNodeId === node.id
                const isEdit = editingNodeId === node.id
                const nEdges = edges.filter(e => e.from.id === node.id)
                const hasOut = nEdges.length > 0
                const isLeaf = !node.isRoot && !hasOut
                const elCnt = (routeEls[node.id] || []).length
                return (
                  <div key={node.id} id={'bn-' + node.id} className="node-card"
                    onMouseDown={e => onNodeMouseDown(e, node.id)}
                    onClick={e => { e.stopPropagation(); setSidebarOpen(false); openEditor(node.id) }}
                    style={{
                      position: 'absolute', left: node.x, top: node.y, width: NODE_W,
                      background: 'var(--s2)',
                      border: `2px solid ${isEdit ? node.color : isSel ? node.color + '88' : 'var(--b2)'}`,
                      borderRadius: 13, overflow: 'hidden', cursor: 'pointer',
                      boxShadow: isEdit
                        ? `0 0 0 3px ${node.color}40,0 10px 40px rgba(0,0,0,.6)`
                        : isSel ? `0 0 0 2px ${node.color}30,0 6px 24px rgba(0,0,0,.4)`
                          : '0 4px 18px rgba(0,0,0,.3)',
                      transition: 'all .15s', userSelect: 'none',
                      opacity: node._saving ? 0.55 : 1,
                    }}>
                    <div style={{ height: 3, background: node.color }} />
                    <div style={{ height: 52, background: `${node.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: node.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>
                        {node._saving ? '…' : '▶'}
                      </div>
                      {node.isRoot && <div style={{ position: 'absolute', top: 4, left: 6, fontSize: 8, fontWeight: 800, color: node.color, background: `${node.color}22`, border: `1px solid ${node.color}44`, padding: '1px 6px', borderRadius: 100 }}>ENTRY</div>}
                      {isEdit && <div style={{ position: 'absolute', top: 4, right: 6, fontSize: 8, fontWeight: 800, color: '#fff', background: node.color, padding: '1px 6px', borderRadius: 3 }}>● EDITING</div>}
                      <div style={{ position: 'absolute', bottom: 3, right: 6, fontSize: 8, color: 'var(--t3)' }}>{fmt(node.duration)}</div>
                      <button className="node-remove-btn" onClick={e => { e.stopPropagation(); removeNode(node.id) }}
                        style={{ position: 'absolute', top: 3, right: isEdit ? 52 : 6, width: 20, height: 20, borderRadius: 6, background: 'rgba(0,0,0,.7)', border: '1px solid rgba(255,107,107,.4)', color: 'var(--red)', fontSize: 11, cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1, fontFamily: 'inherit' }}>
                        ✕
                      </button>
                    </div>
                    <div style={{ padding: '8px 10px 5px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{node.title}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {elCnt > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(30,216,160,.1)', color: 'var(--grn)', padding: '1px 6px', borderRadius: 100 }}>⚡ {elCnt} el{elCnt !== 1 ? 's' : ''}</span>}
                        {isLeaf && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(255,107,107,.1)', color: 'var(--red)', padding: '1px 6px', borderRadius: 100 }}>⚠ Dead end</span>}
                        {!node.isRoot && hasOut && <span style={{ fontSize: 9, background: 'rgba(79,110,247,.08)', color: 'var(--acc)', padding: '1px 6px', borderRadius: 100 }}>{nEdges.length} branch{nEdges.length !== 1 ? 'es' : ''}</span>}
                      </div>
                    </div>
                    {(node.choicePoints || []).length > 0 && (
                      <div style={{ borderTop: '1px solid var(--b1)', padding: '4px 10px 5px' }}>
                        {(node.choicePoints || []).flatMap(cp => (cp.choices || []).map(ch => (
                          <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--t3)', marginBottom: 1 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: ch.color || node.color, flexShrink: 0 }} />
                            {ch.icon} {ch.label}
                            {ch.targetId && <span style={{ color: 'var(--acc)', opacity: .7 }}> → {canvasNodes.find(r => r.id === ch.targetId)?.title}</span>}
                          </div>
                        )))}
                      </div>
                    )}
                    <div style={{ padding: '4px 10px 7px', fontSize: 9, color: isEdit ? node.color : 'var(--t3)' }}>
                      {isEdit ? '● Click to close editor' : 'Click to open editor'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Empty state */}
            {canvasNodes.length === 0 && !routesLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 38, marginBottom: 12, opacity: .2 }}>🎬</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', marginBottom: 5 }}>Drag videos here to start</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>Build your StreamRoute from the left panel</div>
              </div>
            )}
            {canvasNodes.length === 0 && routesLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Loading route…</div>
              </div>
            )}

            <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 9, color: 'var(--t3)', pointerEvents: 'none', zIndex: 4 }}>
              Drag to pan · Scroll to zoom · Click a card to open editor
            </div>

            {canvasNodes.length > 0 && !editNode && <Minimap nodes={canvasNodes} editingNodeId={editingNodeId} />}
          </div>

          {/* ── ELEMENTS EDITOR ── */}
          {editNode && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <BuilderElementsEditor
                key={editNode.id}
                node={editNode}
                elements={routeEls[editNode.id] || []}
                allNodes={canvasNodes}
                edges={edges}
                videos={VIDEOS}
                onChange={newEls => handleElChange(editNode.id, newEls)}
                onNodeChange={updateNode}
                onClose={() => setEditingNodeId(null)}
              />
            </div>
          )}
        </div>

        {/* ── NODE CONFIG PANEL ── */}
        {selNode && !editNode && (
          <NodeConfigPanel
            node={selNode} allNodes={canvasNodes} edges={edges}
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
            videoId={shareVideoId}
            routeName={activeGroup?.name}
            routeId={slug}
            nodes={canvasNodes}
            landingPage={landingPages[activeGroupId]}
            onEditLP={lp => setLandingPages(prev => ({ ...prev, [activeGroupId]: lp }))}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>

      {/* ════ ROUTE PREVIEW MODAL ════ */}
      {previewMode && (
        <RoutePreviewModal
          nodes={canvasNodes}
          routeEls={routeEls}
          videos={VIDEOS}
          mode={previewMode}
          onClose={() => setPreviewMode(null)}
        />
      )}

      {/* ════ MODALS ════ */}
      {newRouteModal && (
        <Modal onClose={() => setNewRouteModal(false)}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>Create New Route</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>Give your StreamRoute a name to get started</div>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Route Name</label>
          <input autoFocus value={newRouteName} onChange={e => setNewRouteName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmNewRoute()}
            placeholder="e.g. Buyer Journey, Listing Walkthrough..."
            style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 9, padding: '12px 14px', color: 'var(--t1)', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setNewRouteModal(false)} style={{ flex: 1, padding: 11, borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={confirmNewRoute} style={{ flex: 1, padding: 11, borderRadius: 9, background: 'var(--acc)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Create Route</button>
          </div>
        </Modal>
      )}

      {unsavedModal && (
        <Modal onClose={() => setUnsavedModal(false)} zIndex={9999}>
          <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', textAlign: 'center', marginBottom: 6 }}>Unsaved Changes</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', textAlign: 'center', lineHeight: 1.6, marginBottom: 22 }}>You have unsaved changes. Save before switching routes?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => { saveRoute(); doLoad(pendingGroupId); setUnsavedModal(false) }} style={{ width: '100%', padding: 11, borderRadius: 10, background: 'var(--acc)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save & Switch</button>
            <button onClick={() => { doLoad(pendingGroupId); setUnsavedModal(false) }} style={{ width: '100%', padding: 11, borderRadius: 10, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--red)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Discard Changes</button>
            <button onClick={() => setUnsavedModal(false)} style={{ width: '100%', padding: 11, borderRadius: 10, background: 'none', border: '1px solid var(--b1)', color: 'var(--t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
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
  const xs = nodes.map(r => r.x), ys = nodes.map(r => r.y)
  const minX = Math.min(...xs) - 20, maxX = Math.max(...xs) + NODE_W + 20
  const minY = Math.min(...ys) - 20, maxY = Math.max(...ys) + NODE_H + 20
  const sc = Math.min(118 / (maxX - minX), 60 / (maxY - minY))
  return (
    <div style={{ position: 'absolute', bottom: 8, right: 8, width: 130, height: 80, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 8, overflow: 'hidden', opacity: .9, zIndex: 5, pointerEvents: 'none' }}>
      <div style={{ fontSize: 7, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', padding: '3px 5px', borderBottom: '1px solid var(--b1)' }}>Overview</div>
      <div style={{ position: 'relative', height: 64 }}>
        {nodes.map(r => {
          const mx = (r.x - minX) * sc + 6, my = (r.y - minY) * sc + 2
          const isE = editingNodeId === r.id
          return (
            <div key={r.id} style={{ position: 'absolute', left: mx, top: my, width: NODE_W * sc, height: 10, background: r.color + (isE ? '' : '55'), borderRadius: 2, boxShadow: isE ? '0 0 0 1px #fff' : 'none' }}>
              {r.isRoot && <div style={{ fontSize: 4, color: '#fff', fontWeight: 900, padding: 1 }}>R</div>}
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
  const connectedTo = edges.filter(e => e.from.id === node.id).map(e => e.to.id)
  const canConn = allNodes.filter(n => n.id !== node.id && !connectedTo.includes(n.id))

  function addCP() { onChange({ choicePoints: [...(node.choicePoints || []), { id: `cp_${Date.now()}`, triggerAt: 60, question: 'What would you like to do next?', subtitle: 'Choose your path', choices: [] }] }) }
  function removeCP(id) { onChange({ choicePoints: (node.choicePoints || []).filter(c => c.id !== id) }) }
  function updateCP(id, p) { onChange({ choicePoints: (node.choicePoints || []).map(c => c.id === id ? { ...c, ...p } : c) }) }
  function addChoice(cpId) {
    onChange({
      choicePoints: (node.choicePoints || []).map(cp => cp.id === cpId ? {
        ...cp, choices: [...(cp.choices || []), { id: `ch_${Date.now()}`, label: `Option ${(cp.choices?.length || 0) + 1}`, icon: '▶', color: node.color, targetId: null }]
      } : cp)
    })
  }
  function updateChoice(cpId, chId, p) {
    onChange({
      choicePoints: (node.choicePoints || []).map(cp => cp.id === cpId ? {
        ...cp, choices: (cp.choices || []).map(ch => ch.id === chId ? { ...ch, ...p } : ch)
      } : cp)
    })
  }
  function removeChoice(cpId, chId) {
    onChange({
      choicePoints: (node.choicePoints || []).map(cp => cp.id === cpId ? {
        ...cp, choices: (cp.choices || []).filter(ch => ch.id !== chId)
      } : cp)
    })
  }

  const Inp = ({ val, onChg, ph = '' }) => (
    <input value={val || ''} onChange={e => onChg(e.target.value)} placeholder={ph}
      style={{ width: '100%', background: 'var(--s4)', border: '1px solid var(--b2)', borderRadius: 7, padding: '6px 9px', color: 'var(--t1)', fontSize: 11, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', marginBottom: 6 }} />
  )

  return (
    <div className="node-config-panel" style={{ width: 265, borderLeft: '1px solid var(--b1)', background: 'var(--s1)', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.title}</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Configure node</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: 4, fontSize: 18, lineHeight: 1, fontFamily: 'inherit' }}>✕</button>
      </div>

      <div style={{ padding: 14, flex: 1, overflowY: 'auto' }}>
        <button onClick={onOpenEditor} style={{ width: '100%', padding: 9, borderRadius: 9, background: 'rgba(79,110,247,.1)', border: '1px solid rgba(79,110,247,.3)', color: 'var(--acc)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
          ⚡ Open Elements Editor
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
          <div className={`toggle-sw ${node.isRoot ? 'on' : ''}`} onClick={() => onChange({ isRoot: !node.isRoot })}>
            <div className="knob" />
          </div>
          <span style={{ fontSize: 12, color: 'var(--t2)' }}>This is the START video</span>
        </label>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>NODE COLOR</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => onChange({ color: c })}
                style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: `2px solid ${node.color === c ? '#fff' : 'transparent'}`, boxShadow: node.color === c ? `0 0 6px ${c}80` : 'none', transition: 'all .15s' }} />
            ))}
          </div>
        </div>

        {canConn.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>CONNECT TO</div>
            {canConn.slice(0, 6).map(n => (
              <button key={n.id} onClick={() => onConnect(node.id, n.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t1)', fontSize: 11, cursor: 'pointer', marginBottom: 5, textAlign: 'left', fontFamily: 'inherit' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: n.color, flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                <span style={{ fontSize: 10, color: 'var(--acc)', flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        )}

        {connectedTo.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>CONNECTIONS</div>
            {connectedTo.map(id => {
              const tn = allNodes.find(n => n.id === id); if (!tn) return null
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', marginBottom: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: tn.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tn.title}</span>
                  <button onClick={() => onDisconnect(node.id, id)} style={{ fontSize: 9, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, fontFamily: 'inherit' }}>✕</button>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>CHOICE POINTS</div>
          {(node.choicePoints || []).length > 0 && (
            <div style={{ marginBottom: 16, background: 'var(--s3)', borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>Timeline ({fmt(node.duration)})</div>
              <div style={{ position: 'relative', height: 28, background: 'var(--s4)', borderRadius: 6, overflow: 'hidden' }}>
                {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                  <div key={pct} style={{ position: 'absolute', left: `${pct * 100}%`, top: 0, bottom: 0, width: 1, background: 'var(--b2)' }} />
                ))}
                {(node.choicePoints || []).map((cp, idx) => {
                  const pct = Math.min(((cp.triggerAt || 0) / node.duration) * 100, 100)
                  return (
                    <div key={cp.id} style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 20, height: 20, borderRadius: '50%', background: node.color, border: '2px solid var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 800, boxShadow: `0 0 8px ${node.color}60` }}>
                      {idx + 1}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 8, color: 'var(--t3)' }}>
                <span>0:00</span><span>{fmt(node.duration * 0.25)}</span><span>{fmt(node.duration * 0.5)}</span><span>{fmt(node.duration * 0.75)}</span><span>{fmt(node.duration)}</span>
              </div>
            </div>
          )}
          {(node.choicePoints || []).map(cp => (
            <div key={cp.id} style={{ background: 'var(--s3)', borderRadius: 9, padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--t2)' }}>Fires at {fmt(cp.triggerAt || 0)}</span>
                <button onClick={() => removeCP(cp.id)} style={{ fontSize: 9, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
              </div>
              <Inp val={cp.question} onChg={v => updateCP(cp.id, { question: v })} ph="Question text..." />
              <input type="number" value={cp.triggerAt || 0} min={0} onChange={e => updateCP(cp.id, { triggerAt: +e.target.value })}
                style={{ width: '100%', background: 'var(--s4)', border: '1px solid var(--b2)', borderRadius: 7, padding: '6px 9px', color: 'var(--t1)', fontSize: 11, marginBottom: 7, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
              {(cp.choices || []).map(ch => (
                <div key={ch.id} style={{ background: 'var(--s2)', borderRadius: 7, padding: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                    <input value={ch.icon || ''} onChange={e => updateChoice(cp.id, ch.id, { icon: e.target.value })}
                      style={{ width: 32, background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 6, padding: '5px 4px', color: 'var(--t1)', fontSize: 13, textAlign: 'center', boxSizing: 'border-box', outline: 'none' }} />
                    <input value={ch.label || ''} onChange={e => updateChoice(cp.id, ch.id, { label: e.target.value })} placeholder="Label"
                      style={{ flex: 1, background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 6, padding: '5px 8px', color: 'var(--t1)', fontSize: 11, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={() => removeChoice(cp.id, ch.id)} style={{ fontSize: 11, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', flexShrink: 0, fontFamily: 'inherit' }}>✕</button>
                  </div>
                  <select value={ch.targetId || ''} onChange={e => updateChoice(cp.id, ch.id, { targetId: e.target.value })}
                    style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: 6, padding: '5px 8px', color: 'var(--t1)', fontSize: 10, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}>
                    <option value="">Select target video...</option>
                    {allNodes.filter(n => n.id !== node.id).map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                  </select>
                </div>
              ))}
              <DashedBtn onClick={() => addChoice(cp.id)}>+ Add Choice</DashedBtn>
            </div>
          ))}
          <DashedBtn onClick={addCP}>+ Add Choice Point</DashedBtn>
        </div>

        <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 14, display: 'flex', gap: 6 }}>
          <button onClick={onDuplicate} style={{ flex: 1, padding: 8, borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⧉ Dupe</button>
          <button onClick={onDelete} style={{ flex: 1, padding: 8, borderRadius: 8, background: 'rgba(255,107,107,.08)', border: '1px solid rgba(255,107,107,.25)', color: 'var(--red)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TINY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function Modal({ children, onClose, zIndex = 999 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--s1)', border: '1px solid var(--b2)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,.5)', animation: 'scaleIn .2s', margin: '0 16px' }}>
        {children}
      </div>
    </div>
  )
}

function DashedBtn({ onClick, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', padding: 7, background: 'transparent', border: `1px dashed ${hov ? 'var(--acc)' : 'var(--b2)'}`, borderRadius: 8, color: hov ? 'var(--acc)' : 'var(--t3)', fontSize: 11, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit', marginTop: 4 }}>
      {children}
    </button>
  )
}