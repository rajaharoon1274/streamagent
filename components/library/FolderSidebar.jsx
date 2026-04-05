'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import Icon from '@/components/ui/Icon'
import toast from 'react-hot-toast'

function FolderIcon({ color = 'currentColor' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
    </svg>
  )
}

export default function FolderSidebar({ folders = [], videos = [], onCreateFolder }) {
  const { state, set } = useApp()
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const allActive    = !state.libFolder
  const uncategorized = videos.filter(v => !v.folder || !folders.find(f => f.id === v.folder))
  const uncActive    = state.libFolder === '__uncategorized__'

  const addFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    const palette = ['#4F6EF7', '#1ED8A0', '#F5A623', '#A855F7', '#FF6B6B', '#06B6D4']
    const color   = palette[folders.length % palette.length]
    try {
      const folder = await onCreateFolder(name, color)
      set({ libFolder: folder.id })
      toast.success('Folder created')
    } catch (err) {
      toast.error('Could not create folder. Please try again.')
    }
    setNewFolderName('')
    setAddingFolder(false)
  }

  return (
    <div className="lib-sidebar" style={{ width: 200, background: 'var(--s1)', borderRight: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

      {/* ── Header: All Videos + Uncategorized ── */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--b1)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 10 }}>Library</div>

        {/* All Videos */}
        <div
          onClick={() => set({ libFolder: null })}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 9, cursor: 'pointer', background: allActive ? 'rgba(79,110,247,0.1)' : 'transparent', color: allActive ? 'var(--acc)' : 'var(--t2)', fontSize: 12, fontWeight: allActive ? 700 : 400 }}
        >
          <Icon name="video" size={13} color={allActive ? 'var(--acc)' : 'var(--t3)'} />
          All Videos
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)' }}>{videos.length}</span>
        </div>

        {/* Uncategorized */}
        {uncategorized.length > 0 && (
          <div
            onClick={() => set({ libFolder: '__uncategorized__' })}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 9, cursor: 'pointer', background: uncActive ? 'rgba(79,110,247,0.1)' : 'transparent', color: uncActive ? 'var(--acc)' : 'var(--t2)', fontSize: 12 }}
          >
            <FolderIcon color={uncActive ? 'var(--acc)' : 'var(--t3)'} />
            Uncategorized
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)' }}>{uncategorized.length}</span>
          </div>
        )}
      </div>

      {/* ── Folders ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>Folders</div>

        {folders.map(f => {
          const cnt = videos.filter(v => v.folder === f.id).length
          const act = state.libFolder === f.id
          return (
            <div
              key={f.id}
              onClick={() => set({ libFolder: f.id })}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.outline = '2px solid var(--acc)' }}
              onDragLeave={e => { e.currentTarget.style.outline = 'none' }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.outline = 'none' }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 9, cursor: 'pointer', background: act ? 'rgba(79,110,247,0.1)' : 'transparent', color: act ? 'var(--acc)' : 'var(--t2)', fontSize: 12, marginBottom: 2, transition: 'all 0.15s' }}
            >
              <FolderIcon color={f.color} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{cnt}</span>
            </div>
          )
        })}

        {/* New folder */}
        <div style={{ marginTop: 10 }}>
          {addingFolder ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFolder()}
                placeholder="Folder name"
                className="prop-inp"
                style={{ fontSize: 11, padding: '6px 8px', flex: 1 }}
              />
              <button onClick={addFolder} style={{ padding: '6px 10px', borderRadius: 7, background: 'var(--acc)', color: '#fff', fontSize: 11, border: 'none', cursor: 'pointer' }}>Add</button>
              <button onClick={() => { setAddingFolder(false); setNewFolderName('') }} style={{ padding: '6px 8px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t3)', fontSize: 11, cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <button
              onClick={() => setAddingFolder(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t3)', fontSize: 11, cursor: 'pointer' }}
            >
              + New Folder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
