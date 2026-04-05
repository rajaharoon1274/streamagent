'use client'
import { useApp } from '@/context/AppContext'
import { VIDEOS } from '@/lib/mockData'

export default function CloneElementsCard({ video: v }) {
  const { state, set } = useApp()

  const elCount   = v.elements?.length ?? 0
  const isOpen    = state.cloneSwapOpen && state.cloneSwapSource === v.id
  const hasTarget = !!state.cloneSwapTarget
  const others    = VIDEOS.filter(ov => ov.id !== v.id)

  function openClone() {
    if (elCount === 0) return
    set({ cloneSwapOpen: true, cloneSwapSource: v.id, cloneSwapTarget: null })
  }

  function cancelClone() {
    set({ cloneSwapOpen: false, cloneSwapSource: null, cloneSwapTarget: null })
  }

  function doClone() {
    set({ cloneSwapOpen: false, cloneSwapSource: null, cloneSwapTarget: null })
  }

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(79,110,247,0.12)', border: '1px solid rgba(79,110,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          📋
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Clone Elements</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>Copy all elements from this video to another</div>
        </div>
        <button
          onClick={openClone}
          disabled={elCount === 0}
          style={{
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            cursor: elCount > 0 ? 'pointer' : 'not-allowed',
            background: elCount > 0
              ? 'linear-gradient(135deg, rgba(79,110,247,0.12), rgba(168,85,247,0.08))'
              : 'var(--s3)',
            border: `1px solid ${elCount > 0 ? 'rgba(79,110,247,0.3)' : 'var(--b2)'}`,
            color: elCount > 0 ? 'var(--acc)' : 'var(--t3)',
            whiteSpace: 'nowrap',
            opacity: elCount > 0 ? 1 : 0.6,
          }}
        >
          {elCount > 0 ? `Clone ${elCount} Element${elCount !== 1 ? 's' : ''}` : 'No Elements'}
        </button>
      </div>

      {/* Expanded panel */}
      {isOpen && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>Select Target Video</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {others.map(ov => {
              const selected = state.cloneSwapTarget === ov.id
              return (
                <div
                  key={ov.id}
                  onClick={() => set({ cloneSwapTarget: ov.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: `1px solid ${selected ? 'var(--acc)' : 'var(--b2)'}`,
                    background: selected ? 'rgba(79,110,247,0.07)' : 'var(--s1)',
                  }}
                >
                  <div style={{ width: 40, height: 25, borderRadius: 4, background: ov.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{ov.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>{ov.dur}</div>
                  </div>
                  {selected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--acc)' }} />}
                </div>
              )
            })}
          </div>

          {hasTarget && (
            <>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={doClone}
                  style={{ flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', background: 'var(--acc)', color: '#fff', border: 'none' }}
                >
                  Clone Elements
                </button>
                <button
                  onClick={cancelClone}
                  style={{ padding: '8px 16px', fontSize: 12, borderRadius: 8, cursor: 'pointer', background: 'var(--s3)', color: 'var(--t2)', border: '1px solid var(--b2)' }}
                >
                  Cancel
                </button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 8, lineHeight: 1.5 }}>
                ⚠️ Element timings will be adjusted proportionally to the target video duration.
              </div>
            </>
          )}
          {!hasTarget && (
            <button onClick={cancelClone} style={{ marginTop: 10, padding: '7px 14px', fontSize: 12, borderRadius: 8, cursor: 'pointer', background: 'var(--s3)', color: 'var(--t2)', border: '1px solid var(--b2)' }}>
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}
