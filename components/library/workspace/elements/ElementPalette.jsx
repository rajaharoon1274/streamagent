'use client'
import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { EL_TYPES, EL_CATS, getTypesByCategory } from './elTypes'

// ── Single draggable element card ─────────────────────────────────────────────
function PaletteCard({ type, def, onDblClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: type,
    data: { type, label: def.label, icon: def.icon, color: def.color },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onDoubleClick={() => onDblClick(type)}
      style={{
        background: isDragging ? 'var(--s2)' : 'var(--bg)',
        border: `1px solid ${isDragging ? `${def.color}66` : 'var(--b2)'}`,
        borderRadius: 11, padding: '12px 13px', marginBottom: 10,
        cursor: 'grab', opacity: isDragging ? 0.4 : 1,
        transition: 'border-color 0.15s, background 0.15s',
        userSelect: 'none',
      }}
      onMouseOver={e => { if (!isDragging) { e.currentTarget.style.borderColor = `${def.color}66`; e.currentTarget.style.background = 'var(--s2)' } }}
      onMouseOut={e => { if (!isDragging) { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.background = 'var(--bg)' } }}
    >
      {/* Icon + title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: `${def.color}22`, border: `1px solid ${def.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        }}>
          {def.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.25, marginBottom: 2 }}>{def.label}</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.3 }}>{def.desc}</div>
        </div>
      </div>
      {/* Footer */}
      <div style={{ fontSize: 9, color: 'var(--t3)', paddingTop: 5, borderTop: '1px solid var(--b1)', marginTop: 3, lineHeight: 1.4 }}>
        Drag to canvas &nbsp;·&nbsp; <span style={{ color: 'var(--acc)' }}>double-click</span> to center
      </div>
    </div>
  )
}

// ── Palette container ─────────────────────────────────────────────────────────
export default function ElementPalette({ onDblClick }) {
  // ── Persist active category tab across refreshes ──────────────────────────
  const [cat, setCat] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('elementPaletteTab') || 'capture'
    }
    return 'capture'
  })

  const [showAll, setShowAll] = useState(false)

  // ── Tab change: update state + persist to sessionStorage ──────────────────
  function handleCatChange(id) {
    setCat(id)
    setShowAll(false)
    sessionStorage.setItem('elementPaletteTab', id)
  }

  const allTypes = getTypesByCategory(cat)
  const INITIAL = 5
  const visible = (!showAll && allTypes.length > INITIAL) ? allTypes.slice(0, INITIAL) : allTypes
  const hasMore = allTypes.length > INITIAL

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '11px 11px 8px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 9 }}>
          Elements
        </div>

        {/* 2×2 category chip grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {EL_CATS.map(c => (
            <button
              key={c.id}
              onClick={() => handleCatChange(c.id)}
              style={{
                padding: '5px 8px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', lineHeight: 1.3, textAlign: 'center',
                background: cat === c.id ? `${c.color}22` : 'var(--s3)',
                border: `1px solid ${cat === c.id ? `${c.color}55` : 'var(--b1)'}`,
                color: cat === c.id ? c.color : 'var(--t3)',
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Element list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 14px' }}>
        {visible.map(([type, def]) => (
          <PaletteCard key={type} type={type} def={def} onDblClick={onDblClick || (() => { })} />
        ))}

        {hasMore && (
          <button
            onClick={() => setShowAll(v => !v)}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 9, background: 'var(--s2)',
              border: '1px solid var(--b2)', color: 'var(--acc)', fontSize: 11,
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 5, marginTop: 4,
            }}
          >
            {showAll ? 'Show Less ↑' : `Show More (${allTypes.length}) ↓`}
          </button>
        )}
      </div>
    </div>
  )
}