'use client'
import { useState } from 'react'

const mkId = () => Math.random().toString(36).slice(2, 8)

// ─── BuilderConnections ───────────────────────────────────────────────────────
// Shows inside the right panel of BuilderElementsEditor when "Connect" tab active.
// Lets the user wire this node to others and manage existing connections.
//
// Props:
//   node          — the node currently being edited
//   allNodes      — full nodes array
//   edges         — computed edges from getEdges(nodes)
//   onNodeChange  — (nodeId, patch) => void  — updates node via Builder
export default function BuilderConnections({ node, allNodes, edges, onNodeChange }) {
  const [addingCP, setAddingCP] = useState(false)

  if (!node) {
    return (
      <div style={{ padding:20, textAlign:'center', color:'var(--t3)', fontSize:11 }}>
        No node selected
      </div>
    )
  }

  const myEdges    = edges.filter(e => e.from.id === node.id)
  const otherNodes = allNodes.filter(n => n.id !== node.id)

  // ── Add a new choice point connecting to a target ─────────────────────────
  function connectTo(targetId) {
    const target = allNodes.find(n => n.id === targetId)
    if (!target) return

    // Check if already connected
    const alreadyConnected = myEdges.some(e => e.to.id === targetId)

    const newCP = {
      id:        mkId(),
      triggerAt: 60,
      question:  'What would you like to do next?',
      subtitle:  'Choose your path',
      choices: [{
        id:       mkId(),
        label:    target.title,
        icon:     '▶',
        color:    target.color || '#4F6EF7',
        targetId: targetId,
      }],
    }

    onNodeChange(node.id, {
      choicePoints: [...(node.choicePoints || []), newCP],
    })
  }

  // ── Disconnect (remove all choices pointing to targetId) ─────────────────
  function disconnectFrom(targetId) {
    const updated = (node.choicePoints || [])
      .map(cp => ({
        ...cp,
        choices: (cp.choices || []).filter(ch => ch.targetId !== targetId),
      }))
      .filter(cp => (cp.choices || []).length > 0)

    onNodeChange(node.id, { choicePoints: updated })
  }

  // ── Add blank choice point ────────────────────────────────────────────────
  function addBlankCP() {
    const newCP = {
      id:        mkId(),
      triggerAt: 60,
      question:  'What would you like to do next?',
      subtitle:  'Choose your path',
      choices:   [],
    }
    onNodeChange(node.id, {
      choicePoints: [...(node.choicePoints || []), newCP],
    })
    setAddingCP(false)
  }

  return (
    <div style={{ padding:14 }}>

      {/* ── Section label ── */}
      <div style={{ fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:.6, marginBottom:10 }}>
        Route Connections
      </div>

      {/* ── Add choice point CTA ── */}
      <button onClick={addBlankCP}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 12px', borderRadius:9, background:'var(--acc)', color:'#fff', fontSize:11, fontWeight:700, border:'none', cursor:'pointer', marginBottom:14, fontFamily:'inherit' }}>
        ⑂ Add Choice Point
      </button>

      {/* ── Existing connections ── */}
      {myEdges.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--t2)', marginBottom:7 }}>Current connections</div>
          {myEdges.map(e => (
            <div key={`${e.from.id}-${e.choice.id}`}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 9px', borderRadius:9, background:`${e.choice.color || e.from.color}12`, border:`1px solid ${e.choice.color || e.from.color}33`, marginBottom:5 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{e.choice.icon || '▶'}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.choice.label}</div>
                <div style={{ fontSize:9, color:'var(--t3)' }}>→ {e.to.title}</div>
              </div>
              <button onClick={() => disconnectFrom(e.to.id)}
                style={{ width:20, height:20, borderRadius:5, background:'rgba(255,107,107,.08)', border:'1px solid rgba(255,107,107,.2)', color:'var(--red)', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'inherit' }}>
                ✕
              </button>
            </div>
          ))}
          <div style={{ height:8 }}/>
        </div>
      )}

      {/* ── Connect to other nodes ── */}
      {otherNodes.length > 0 ? (
        <div>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--t2)', marginBottom:7 }}>Connect to video</div>
          {otherNodes.map(n => {
            const isConnected = myEdges.some(e => e.to.id === n.id)
            return (
              <div key={n.id}
                onClick={() => connectTo(n.id)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:9, background:isConnected ? `${n.color}14` : 'var(--s2)', border:`1.5px solid ${isConnected ? n.color : 'var(--b2)'}`, marginBottom:6, cursor:'pointer', transition:'all .15s' }}
                onMouseOver={e => { if (!isConnected) { e.currentTarget.style.borderColor = n.color + '88'; e.currentTarget.style.background = `${n.color}08` } }}
                onMouseOut={e  => { if (!isConnected) { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.background = 'var(--s2)' } }}>
                <div style={{ width:32, height:22, borderRadius:5, background:n.color, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#fff' }}>▶</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</div>
                  <div style={{ fontSize:9, color:isConnected ? n.color : 'var(--t3)' }}>
                    {isConnected ? '✓ Connected — click to add another branch' : 'Click to connect'}
                  </div>
                </div>
                <span style={{ fontSize:16, color:isConnected ? n.color : 'var(--t3)', flexShrink:0 }}>
                  {isConnected ? '✓' : '→'}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ padding:'14px 12px', borderRadius:9, border:'1px dashed var(--b2)', textAlign:'center', fontSize:10, color:'var(--t3)', lineHeight:1.6 }}>
          Drag more videos onto the canvas to connect them here.
        </div>
      )}
    </div>
  )
}