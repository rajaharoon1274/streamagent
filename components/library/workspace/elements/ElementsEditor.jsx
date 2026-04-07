'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core'
import toast from 'react-hot-toast'

import ElementPalette    from './ElementPalette'
import ElementCanvas     from './ElementCanvas'
import ElementProperties from './ElementProperties'
import { EL_TYPES }      from './elTypes'
import { useElements }   from '@/hooks/useElements'


function parseDuration(v) {
  if (!v) return 180
  if (typeof v === 'number') return v
  const [m, s] = String(v).split(':').map(Number)
  return (isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s)
}

const FS_TYPES  = new Set(['funnel-urgency','cta-email','cta-booking','cta-download','survey-poll','survey-rating','survey-nps'])
const MOB_TYPES = new Set(['mob-call','mob-sms','mob-vcard','mob-calendar','mob-swipe','mob-share','mob-directions','mob-screenshot','mob-shake'])
const GATE_DFLT = new Set(['funnel-urgency','cta-email','cta-booking','cta-download'])

function makeCanvasElement(type) {
  const def = EL_TYPES[type] || {}
  let xPct=10, yPct=10, wPct=40, hPct=25
  if      (FS_TYPES.has(type))          { xPct=0;  yPct=0;  wPct=100; hPct=100 }
  else if (MOB_TYPES.has(type))         { xPct=0;  yPct=78; wPct=100; hPct=14  }
  else if (type==='sticky-bar')         { xPct=0;  yPct=0;  wPct=100; hPct=10  }
  else if (type==='overlay-text')       { xPct=5;  yPct=5;  wPct=60;  hPct=14  }
  else if (type==='overlay-chapter')    { xPct=0;  yPct=5;  wPct=40;  hPct=18  }
  else if (type==='overlay-countdown')  { xPct=35; yPct=35; wPct=30;  hPct=22  }
  else if (type==='cta-button')         { xPct=35; yPct=78; wPct=30;  hPct=12  }
  else if (type==='annotation-link')    { xPct=5;  yPct=60; wPct=40;  hPct=18  }
  else if (type==='share-social')       { xPct=5;  yPct=78; wPct=45;  hPct=12  }
  else if (type==='image-clickable')    { xPct=10; yPct=10; wPct=35;  hPct=35  }

  return {
    type,
    props:      { ...(def.defs || {}) },
    xPct, yPct, wPct, hPct,
    timing:     { mode:'at-time', in:0, duration:5, animIn:'fadeIn', animOut:'fadeOut', animSpeed:'0.4', trigger:'time' },
    gate:       { enabled: GATE_DFLT.has(type) },
    conditions: MOB_TYPES.has(type) ? [{ type: 'device', value: 'mobile' }] : [],
    opacity:    1,
    zIndex:     1,
  }
}
function debounce(fn, ms) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

export default function ElementsEditor({ video: v, accentColor, onBack }) {
  const videoId = v?.id

  // Real data from DB
  const {
    elements:        dbElements,
    isLoading:       elementsLoading,
    createElement,
    updateElement,
    deleteElement,
    bulkSaveElements,
  } = useElements(videoId)

  const [localElements, setLocalElements] = useState([])
  const [selectedId,  setSelectedId] = useState(null)
  const [activeType,  setActiveType] = useState(null)
  const [saving,      setSaving]     = useState(false)
  const [saved,       setSaved]      = useState(false)
  const [showGrid,    setShowGrid]   = useState(false)   // CHANGED: was true, HTML default is false
  const [currentTime, setCurTime]    = useState(0)
  const [playing,     setPlaying]    = useState(false)

  const playRef     = useRef(null)
  const initialised  = useRef(false)
  const accent      = accentColor || '#4F6EF7'
  const duration    = parseDuration(v?.duration_seconds || v?.dur)

  // Sync DB elements → local state (only on first load)
useEffect(() => {
  if (!elementsLoading && !initialised.current && dbElements.length >= 0) {
    setLocalElements(dbElements)
    initialised.current = true
  }
}, [elementsLoading, dbElements])

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        setCurTime(t => {
          if (t >= duration) { setPlaying(false); return 0 }
          return +(t + 0.1).toFixed(2)
        })
      }, 100)
    } else { clearInterval(playRef.current) }
    return () => clearInterval(playRef.current)
  }, [playing, duration])

  function togglePlay() {
    if (currentTime >= duration) setCurTime(0)
    // Deselect element when starting playback
    setPlaying(p => {
      if (!p) setSelectedId(null) // If starting to play, deselect
      return !p
    })
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

const addElement = useCallback(async (type) => {
  const meta     = EL_TYPES[type]
  const canvasEl = makeCanvasElement(type)
  setPlaying(false)

  // Show placeholder immediately (optimistic)
  const tempId = `temp-${Date.now()}`
  const tempEl = { ...canvasEl, id: tempId, _isTemp: true }
  setLocalElements(prev => [...prev, tempEl])

  try {
    // POST to DB — returns element with real UUID
    const saved = await createElement(canvasEl)
    // Replace temp with real element
    setLocalElements(prev => prev.map(el => el.id === tempId ? saved : el))
    setSelectedId(saved.id)
    toast.success(`${meta?.icon || '⚡'} ${meta?.label || type} added`, { duration: 1500 })
  } catch (err) {
    // Remove temp if failed
    setLocalElements(prev => prev.filter(el => el.id !== tempId))
    toast.error('Failed to add element')
    console.error('[addElement]', err.message)
  }
}, [createElement])

const updateElementRef = useRef(updateElement)
useEffect(() => { updateElementRef.current = updateElement }, [updateElement])

const debouncedUpdate = useRef(
  debounce(async (el) => {
    if (!el.id || el._isTemp) return
    try {
      await updateElementRef.current(el.id, el)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast.error('Failed to save changes')
      console.error('[handleChange]', err.message)
    }
  }, 800)
).current

  function handleDragStart({ active }) { setActiveType(active.id) }
  function handleDragEnd({ active, over }) {
    setActiveType(null)
    if (over?.id === 'canvas') addElement(active.id)
  }

  function handleSelect(id) {
    setSelectedId(id)
    // Pause video when selecting element
    if (playing) setPlaying(false)
  }

  function handleChange(updated) {
  setLocalElements(prev => prev.map(el => el.id === updated.id ? updated : el))
  debouncedUpdate(updated)
}
async function handleDelete(id) {
  // Optimistic remove
  setLocalElements(prev => prev.filter(el => el.id !== id))
  if (selectedId === id) setSelectedId(null)
  toast('Element removed', { icon: '🗑', duration: 1500 })

  try {
    await deleteElement(id)
  } catch (err) {
    toast.error('Failed to delete element')
    console.error('[handleDelete]', err.message)
  }
}
  async function handleBulkSave(elements) {
  try {
    await bulkSaveElements(elements)
  } catch (err) {
    console.error('[handleBulkSave]', err.message)
  }
}

  async function handleManualSave() {
  if (!videoId) return
  setSaving(true)
  try {
    const toSave = localElements.filter(el => el.id && !el._isTemp)
    if (toSave.length > 0) await bulkSaveElements(toSave)
    setSaved(true)
    toast.success('Elements saved!')
    setTimeout(() => setSaved(false), 3000)
  } catch {
    toast.error('Failed to save')
  } finally {
    setSaving(false)
  }
}
  const selectedElement = localElements.find(el => el.id === selectedId) || null
  const dragMeta        = activeType ? (EL_TYPES[activeType] || {}) : null

if (elementsLoading && localElements.length === 0) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t3)', fontSize: 13 }}>
      Loading elements...
    </div>
  )
}
  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="elements-editor-wrap" style={{ display:'flex', height:'100%', overflow:'hidden', background:'var(--bg)' }}>

        {/* ── Left: Palette (unchanged) ── */}
        <div className="elements-palette-col" style={{ width:270, flexShrink:0, borderRight:'1px solid var(--b1)', overflow:'hidden', background:'var(--s1)', display:'flex', flexDirection:'column' }}>
          {onBack && (
            <div style={{ padding:'8px 10px', borderBottom:'1px solid var(--b1)', flexShrink:0 }}>
              <button onClick={onBack}
                onMouseOver={e => e.currentTarget.style.background = 'var(--s3)'}
                onMouseOut={e  => e.currentTarget.style.background = 'none'}
                style={{ display:'flex', alignItems:'center', gap:7, background:'none', border:'none',
                  cursor:'pointer', padding:'5px 7px', borderRadius:7, width:'100%', transition:'background 0.15s' }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'var(--s3)', border:'1px solid var(--b2)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
                </div>
                <span style={{ fontSize:11, color:'var(--t3)', fontWeight:500 }}>Back to Library</span>
              </button>
            </div>
          )}
          <ElementPalette onDblClick={addElement} />
        </div>

        {/* ── Centre: Canvas + toolbar ── */}
        <div className="elements-canvas-col" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* CHANGED: height 40→46, padding '0 12px'→'0 16px' to match HTML */}
          <div style={{ height:46, display:'flex', alignItems:'center', padding:'0 16px',
            borderBottom:'1px solid var(--b1)', background:'var(--s1)', gap:8, flexShrink:0 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--t1)' }}>Elements Editor</span>
            <div style={{ flex:1 }} />

            {/* CHANGED: width/height 28→30 to match HTML */}
            <button onClick={togglePlay}
              style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                background:accent, border:'none', cursor:'pointer' }}>
              {playing
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><polygon points="6,4 20,12 6,20"/></svg>}
            </button>

            <span style={{ fontSize:12, fontFamily:'monospace', color:'var(--t2)', minWidth:80 }}>
              {String(Math.floor(currentTime/60)).padStart(1,'0')}:{String(Math.floor(currentTime%60)).padStart(2,'0')}
              &nbsp;/&nbsp;
              {String(Math.floor(duration/60)).padStart(1,'0')}:{String(Math.floor(duration%60)).padStart(2,'0')}
            </span>

            <button onClick={() => setShowGrid(g => !g)}
              style={{ padding:'4px 10px', borderRadius:7, fontSize:10, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4,
                background:showGrid?`${accent}22`:'var(--s3)',
                border:`1px solid ${showGrid?`${accent}55`:'var(--b2)'}`,
                color:showGrid?accent:'var(--t2)' }}>
              ⊞ Grid
            </button>

            {saved ? (
              <span style={{ fontSize:11, color:'var(--grn)', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--grn)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
                Saved
              </span>
            ) : (
              <button onClick={handleManualSave} disabled={saving}
                style={{ padding:'5px 13px', borderRadius:7, fontSize:11, fontWeight:700,
                  cursor:saving?'not-allowed':'pointer',
                  background:saving?'var(--s3)':accent, border:'none',
                  color:saving?'var(--t3)':'#fff' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>

          <ElementCanvas
            elements={localElements} selectedId={selectedId}
            onSelect={handleSelect} onDeselect={() => setSelectedId(null)}
            onElementChange={handleChange} onDelete={handleDelete}
             onBulkSave={handleBulkSave} 
            accentColor={accent} video={v} showGrid={showGrid}
            currentTime={currentTime} duration={duration} onSeek={setCurTime}
            playing={playing} onTogglePlay={togglePlay}
          />
        </div>

        {/* CHANGED: width 270→284 to match HTML */}
        <div className="elements-properties-col" style={{ width:284, flexShrink:0, borderLeft:'1px solid var(--b1)', overflow:'hidden', background:'var(--s1)', display:'flex', flexDirection:'column' }}>
          <ElementProperties element={selectedElement} elements={localElements}
            onChange={handleChange} onDelete={handleDelete} onSelect={handleSelect} />
        </div>
      </div>

      {/* Responsive CSS for smaller screens */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .elements-editor-wrap {
            flex-direction: column !important;
            height: 100% !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          
          /* Order: 1. Canvas+Timeline (top) */
          .elements-canvas-col {
            order: 1 !important;
            width: 100% !important;
            height: auto !important;
            flex: 0 0 auto !important;
            min-height: 500px !important;
            max-height: none !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
            border-right: none !important;
            border-bottom: 1px solid var(--b1) !important;
          }
          
          /* Order: 2. Palette (middle) - show at least 2 elements */
          .elements-palette-col {
            order: 2 !important;
            width: 100% !important;
            height: auto !important;
            flex: 0 0 auto !important;
            max-height: 320px !important;
            min-height: 280px !important;
            border-right: none !important;
            border-bottom: 1px solid var(--b1) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          
          /* Order: 3. Properties (bottom) */
          .elements-properties-col {
            order: 3 !important;
            width: 100% !important;
            height: auto !important;
            flex: 0 0 auto !important;
            max-height: none !important;
            min-height: 350px !important;
            border-left: none !important;
            border-top: 1px solid var(--b1) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
        }
        
        @media (max-width: 600px) {
          .elements-canvas-col {
            min-height: 450px !important;
          }
          
          .elements-palette-col {
            max-height: 300px !important;
            min-height: 260px !important;
          }
          
          .elements-properties-col {
            min-height: 300px !important;
          }
        }
      `}</style>

      <DragOverlay dropAnimation={null}>
        {activeType && dragMeta ? (
          <div style={{ padding:'6px 11px', borderRadius:8, display:'flex', alignItems:'center', gap:7,
            background:dragMeta.color||accent, color:'#fff', fontSize:11, fontWeight:700,
            boxShadow:'0 8px 24px rgba(0,0,0,0.4)', opacity:0.92, pointerEvents:'none' }}>
            <span style={{ fontSize:14 }}>{dragMeta.icon}</span>{dragMeta.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}