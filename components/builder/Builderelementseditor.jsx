'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor,
  useSensor, useSensors, pointerWithin,
} from '@dnd-kit/core'
import ElementPalette    from '../library/workspace/elements/ElementPalette'
import ElementCanvas     from '../library/workspace/elements/ElementCanvas'
import ElementProperties from '../library/workspace/elements/ElementProperties'
import { EL_TYPES }      from '../library/workspace/elements/elTypes'
import BuilderConnections from './Builderconnections'

// ─── helpers ──────────────────────────────────────────────────────────────────
let _nextId = 1
const makeId = () => `bel-${Date.now()}-${_nextId++}`
const fmt    = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

const FS_TYPES  = new Set(['funnel-urgency','cta-email','cta-booking','cta-download','survey-poll','survey-rating','survey-nps'])
const MOB_TYPES = new Set(['mob-call','mob-sms','mob-vcard','mob-calendar','mob-swipe','mob-share','mob-directions','mob-screenshot','mob-shake'])
const GATE_DFLT = new Set(['funnel-urgency','cta-email','cta-booking','cta-download'])

function makeElement(type) {
  const def = EL_TYPES[type] || {}
  let xPct=10, yPct=10, wPct=40, hPct=25
  if      (FS_TYPES.has(type))         { xPct=0;  yPct=0;  wPct=100; hPct=100 }
  else if (MOB_TYPES.has(type))        { xPct=0;  yPct=78; wPct=100; hPct=14  }
  else if (type==='sticky-bar')        { xPct=0;  yPct=0;  wPct=100; hPct=10  }
  else if (type==='overlay-text')      { xPct=5;  yPct=5;  wPct=60;  hPct=14  }
  else if (type==='overlay-chapter')   { xPct=0;  yPct=5;  wPct=40;  hPct=18  }
  else if (type==='overlay-countdown') { xPct=35; yPct=35; wPct=30;  hPct=22  }
  else if (type==='cta-button')        { xPct=35; yPct=78; wPct=30;  hPct=12  }
  else if (type==='annotation-link')   { xPct=5;  yPct=60; wPct=40;  hPct=18  }
  else if (type==='share-social')      { xPct=5;  yPct=78; wPct=45;  hPct=12  }
  else if (type==='image-clickable')   { xPct=10; yPct=10; wPct=35;  hPct=35  }
  return {
    id:         makeId(),
    type,
    props:      { ...(def.defs || {}) },
    xPct, yPct, wPct, hPct,
    timing:     { mode:'at-time', in:0, duration:5, animIn:'fadeIn', animOut:'fadeOut', animSpeed:'0.4', trigger:'time' },
    gate:       { enabled: GATE_DFLT.has(type) },
    conditions: [],
    opacity:    1,
    zIndex:     1,
  }
}

// ─── Right panel tabs ─────────────────────────────────────────────────────────
const RIGHT_TABS = [
  { id:'props',       label:'Properties' },
  { id:'connections', label:'Connect',   green: true },
]

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// Props:
//   node         — canvas node being edited (id, title, color, duration, videoId)
//   elements     — current element array for this node
//   allNodes     — full nodes array (for connections tab)
//   edges        — computed edges (for connections tab)
//   videos       — VIDEOS array
//   onChange     — (newElements) => void
//   onNodeChange — (nodeId, patch) => void  (for connection wiring)
//   onClose      — () => void
// ═══════════════════════════════════════════════════════════════════════════════
export default function BuilderElementsEditor({
  node,
  elements: initEls,
  allNodes = [],
  edges    = [],
  videos   = [],
  onChange,
  onNodeChange,
  onClose,
}) {
  const [elements,   setElements]   = useState(initEls || [])
  const [selectedId, setSelectedId] = useState(null)
  const [activeType, setActiveType] = useState(null)
  const [showGrid,   setShowGrid]   = useState(false)
  const [currentTime,setCurTime]    = useState(0)
  const [playing,    setPlaying]    = useState(false)
  const [rightTab,   setRightTab]   = useState('props')   // 'props' | 'connections'

  const playRef    = useRef(null)
  const dur        = node?.duration || 240
  const accent     = node?.color || '#4F6EF7'

  // ── Sync when node changes ──────────────────────────────────────────────────
  const prevNodeId = useRef(node?.id)
  useEffect(() => {
    if (node?.id !== prevNodeId.current) {
      prevNodeId.current = node?.id
      setElements(initEls || [])
      setSelectedId(null)
      setCurTime(0)
      setPlaying(false)
    }
  }, [node?.id, initEls])

  // ── Playback ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        setCurTime(t => {
          if (t >= dur) { setPlaying(false); return 0 }
          return +(t + 0.1).toFixed(2)
        })
      }, 100)
    } else {
      clearInterval(playRef.current)
    }
    return () => clearInterval(playRef.current)
  }, [playing, dur])

  function togglePlay() {
    if (currentTime >= dur) setCurTime(0)
    setPlaying(p => !p)
  }

  // ── Element CRUD ─────────────────────────────────────────────────────────────
  const addEl = useCallback(type => {
    const el = makeElement(type)
    setElements(prev => {
      const next = [...prev, el]
      onChange(next)
      return next
    })
    setSelectedId(el.id)
  }, [onChange])

  function handleChange(updated) {
    setElements(prev => {
      const next = prev.map(el => el.id === updated.id ? updated : el)
      onChange(next)
      return next
    })
  }

  function handleDelete(id) {
    setElements(prev => {
      const next = prev.filter(el => el.id !== id)
      onChange(next)
      return next
    })
    if (selectedId === id) setSelectedId(null)
  }

  // ── DnD ─────────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )
  function handleDragStart({ active }) { setActiveType(active.id) }
  function handleDragEnd({ active, over }) {
    setActiveType(null)
    if (over?.id === 'canvas') addEl(active.id)
  }

  const selectedElement = elements.find(el => el.id === selectedId) || null
  const dragMeta        = activeType ? (EL_TYPES[activeType] || {}) : null
  const videoObj        = {
    id:               node?.id,
    title:            node?.title,
    color:            node?.color || accent,
    aspectRatio:      videos.find(v => v.id === node?.videoId)?.aspectRatio || '16:9',
    duration_seconds: dur,
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

      {/* Colored top border matching node color */}
      <div style={{ height:2, background:accent, flexShrink:0 }}/>

      <div style={{ display:'flex', flex:1, overflow:'hidden', background:'var(--bg)' }}>

        {/* ── LEFT: Element Palette ── */}
        <div style={{ width:220, flexShrink:0, borderRight:'1px solid var(--b1)', overflow:'hidden', background:'var(--s1)', display:'flex', flexDirection:'column' }}>
          <ElementPalette onDblClick={addEl} />
        </div>

        {/* ── CENTRE: Mini-toolbar + Canvas ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* Mini-toolbar */}
          <div style={{ height:42, display:'flex', alignItems:'center', padding:'0 12px', borderBottom:'1px solid var(--b1)', background:'var(--s1)', gap:8, flexShrink:0 }}>
            {/* Node color dot + name */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 9px', borderRadius:7, background:`${accent}15`, border:`1px solid ${accent}30`, flexShrink:0, maxWidth:200 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:accent, flexShrink:0 }}/>
              <span style={{ fontSize:11, fontWeight:700, color:accent, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{node?.title}</span>
            </div>

            {/* Play / time */}
            <button onClick={togglePlay}
              style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:accent, border:'none', cursor:'pointer', flexShrink:0 }}>
              {playing
                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>
                : <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><polygon points="6,4 20,12 6,20"/></svg>}
            </button>

            <span style={{ fontSize:10, fontFamily:'monospace', color:'var(--t2)', whiteSpace:'nowrap', flexShrink:0 }}>
              {fmt(currentTime)} / {fmt(dur)}
            </span>

            <input type="range" min={0} max={dur} step={0.5} value={currentTime}
              onChange={e => setCurTime(+e.target.value)}
              style={{ flex:1, accentColor:accent, cursor:'pointer', minWidth:50 }}/>

            <span style={{ fontSize:9, color:'var(--t3)', whiteSpace:'nowrap', flexShrink:0 }}>
              {elements.length} el{elements.length !== 1 ? 's' : ''}
            </span>

            <button onClick={() => setShowGrid(g => !g)}
              style={{ padding:'3px 8px', borderRadius:6, fontSize:9, fontWeight:600, cursor:'pointer',
                background:showGrid ? `${accent}22` : 'var(--s3)',
                border:`1px solid ${showGrid ? `${accent}55` : 'var(--b2)'}`,
                color:showGrid ? accent : 'var(--t2)', flexShrink:0 }}>
              ⊞ Grid
            </button>

            <button onClick={onClose}
              style={{ width:26, height:26, borderRadius:6, background:'var(--s3)', border:'1px solid var(--b2)', color:'var(--t2)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'inherit' }}>
              ✕
            </button>
          </div>

          {/* Canvas + timeline */}
          <ElementCanvas
            elements={elements}
            selectedId={selectedId}
            onSelect={id => { setSelectedId(id); setRightTab('props') }}
            onDeselect={() => setSelectedId(null)}
            onElementChange={handleChange}
            onDelete={handleDelete}
            accentColor={accent}
            video={videoObj}
            showGrid={showGrid}
            currentTime={currentTime}
            duration={dur}
            onSeek={setCurTime}
            playing={playing}
            onTogglePlay={togglePlay}
          />
        </div>

        {/* ── RIGHT: Tabbed panel (Properties + Connections) ── */}
        <div style={{ width:272, flexShrink:0, borderLeft:'1px solid var(--b1)', background:'var(--s1)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Tab bar */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--b1)', flexShrink:0 }}>
            {RIGHT_TABS.map(tab => {
              const active = rightTab === tab.id
              const color  = tab.green ? 'var(--grn)' : 'var(--acc)'
              return (
                <button key={tab.id} onClick={() => setRightTab(tab.id)}
                  style={{ flex:1, padding:'9px 4px', fontSize:11, fontWeight:active ? 700 : 500, cursor:'pointer', background:'transparent', border:'none', color:active ? color : 'var(--t3)', borderBottom:`2px solid ${active ? color : 'transparent'}`, transition:'all .15s', fontFamily:'inherit' }}>
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            {rightTab === 'props' && (
              <ElementProperties
                element={selectedElement}
                elements={elements}
                onChange={handleChange}
                onDelete={handleDelete}
                onSelect={id => { setSelectedId(id) }}
              />
            )}

            {rightTab === 'connections' && (
              <div style={{ flex:1, overflowY:'auto' }}>
                <BuilderConnections
                  node={node}
                  allNodes={allNodes}
                  edges={edges}
                  onNodeChange={onNodeChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DnD ghost */}
      <DragOverlay dropAnimation={null}>
        {activeType && dragMeta ? (
          <div style={{ padding:'6px 11px', borderRadius:8, display:'flex', alignItems:'center', gap:7, background:dragMeta.color || accent, color:'#fff', fontSize:11, fontWeight:700, boxShadow:'0 8px 24px rgba(0,0,0,.4)', opacity:.92, pointerEvents:'none' }}>
            <span style={{ fontSize:14 }}>{dragMeta.icon}</span>{dragMeta.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}