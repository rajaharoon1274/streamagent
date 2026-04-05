'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { useLibrary } from '@/hooks/useLibrary'
import toast from 'react-hot-toast'

const PLAYER_MODES = [
  { id: 'native', label: 'Native Player', desc: 'HTML5 · Mobile friendly' },
  { id: 'stream', label: 'StreamRoute', desc: 'Interactive · Lead capture' },
]

export default function SettingsTab({ video: initialVideo }) {
  const router = useRouter()
  const { state, set } = useApp()
  const { folders, mutate } = useLibrary()

  // Form state
  const [title, setTitle] = useState('')
  const [privacy, setPrivacy] = useState('draft')
  const [password, setPassword] = useState('')
  const [passwordHeadline, setPasswordHeadline] = useState('')
  const [passwordHint, setPasswordHint] = useState('')
  const [folderId, setFolderId] = useState('')
  const [commentsEnabled, setCommentsEnabled] = useState(false)
  const [playerMode, setPlayerMode] = useState('native')

  // UI state
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [titleError, setTitleError] = useState('')

  // Original data (to detect changes) — seeded synchronously from prop
  const [originalData, setOriginalData] = useState(initialVideo)

  // Track which video id the form was last seeded from.
  // Only re-seed when a DIFFERENT video is opened — tab switches for the same
  // video do NOT reset the form so unsaved edits are preserved.
  const seededForId = useRef(null)

  function populateForm(video) {
    setTitle(video.title || '')
    setPrivacy(video.privacy || 'draft')
    setPassword('')
    setPasswordHeadline(video.password_headline || '')
    setPasswordHint(video.password_hint || '')
    setFolderId(video.folder_id || '')
    setCommentsEnabled(video.comments_enabled ?? false)
    setPlayerMode(video.playerMode || 'native')
    setOriginalData(video)
    setTitleError('')
    seededForId.current = video.id
  }

  // Seed form the first time (or when a different video is opened)
  useEffect(() => {
    if (seededForId.current !== initialVideo.id) {
      populateForm(initialVideo)
    }
  }, [initialVideo.id])

  // Detect changes
  const getChanges = () => {
    if (!originalData) return {}
    const changes = {}

    if (title !== originalData.title) {
      changes.title = title
    }
    if (privacy !== originalData.privacy) {
      changes.privacy = privacy
    }
    if (folderId !== (originalData.folder_id || '')) {
      changes.folder_id = folderId || null
    }
    if (commentsEnabled !== (originalData.comments_enabled ?? false)) {
      changes.comments_enabled = commentsEnabled
    }
    if (playerMode !== (originalData.playerMode || 'native')) {
      changes.playerMode = playerMode
    }

    // Only include password if user typed something new
    if (password.trim()) {
      changes.password = password
    }
    if (passwordHeadline !== (originalData.password_headline || '')) {
      changes.password_headline = passwordHeadline
    }
    if (passwordHint !== (originalData.password_hint || '')) {
      changes.password_hint = passwordHint
    }

    return changes
  }

  const handleSave = async () => {
    // Validate title
    if (!title.trim()) {
      setTitleError('Title cannot be empty')
      return
    }
    setTitleError('')

    const changes = getChanges()
    if (Object.keys(changes).length === 0) {
      toast.success('No changes to save')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/videos/${initialVideo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }

      const updated = await res.json()
      setOriginalData(updated)
      // Refresh SWR cache → Library re-renders with new title/settings immediately
      await mutate()
      toast.success('Saved ✓')
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      const res = await fetch(`/api/videos/${initialVideo.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Duplicate failed')
      }

      toast.success('✓ Video duplicated!')
      // Update AppContext to open the new video, then push URL
      set({ libSelectedVideo: data.id, videoDetailTab: 'overview' })
      router.push(`/library/${data.id}`)
    } catch (err) {
      console.error('Duplicate error:', err)
      toast.error(err.message || 'Duplicate failed. Please try again.')
    } finally {
      setDuplicating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/videos/${initialVideo.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }

      toast.success('Video deleted')
      set({ libSelectedVideo: null, videoDetailTab: 'overview' })
      router.push('/library')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Delete failed. Please try again.')
      setDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const hasChanges = Object.keys(getChanges()).length > 0

  return (
    <div style={{ padding: '0 20px 20px', maxWidth: 640 }}>
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            setTitleError('')
          }}
          placeholder="Video title"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: titleError ? '1px solid #EF4444' : '1px solid var(--b2)',
            background: 'var(--s2)',
            color: 'var(--t1)',
            fontSize: 13,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        {titleError && (
          <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{titleError}</div>
        )}
      </div>

      {/* Privacy */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Privacy
        </label>
        <select
          value={privacy}
          onChange={e => setPrivacy(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--b2)',
            background: 'var(--s2)',
            color: 'var(--t1)',
            fontSize: 13,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="password">Password Protected</option>
        </select>
      </div>

      {/* Password fields (only show when password-protected) */}
      {privacy === 'password' && (
        <>
          <div style={{ marginBottom: 20, padding: '16px', borderRadius: 8, background: 'rgba(79,110,247,0.08)', border: '1px solid rgba(79,110,247,0.2)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', marginBottom: 12 }}>Password Protection</div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 4, textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--b2)',
                  background: 'var(--s2)',
                  color: 'var(--t1)',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 4, textTransform: 'uppercase' }}>
                Headline (shown on lock screen)
              </label>
              <input
                type="text"
                value={passwordHeadline}
                onChange={e => setPasswordHeadline(e.target.value)}
                placeholder="e.g., Enter password to watch"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--b2)',
                  background: 'var(--s2)',
                  color: 'var(--t1)',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 4, textTransform: 'uppercase' }}>
                Hint (optional)
              </label>
              <input
                type="text"
                value={passwordHint}
                onChange={e => setPasswordHint(e.target.value)}
                placeholder="e.g., Hint: company name"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--b2)',
                  background: 'var(--s2)',
                  color: 'var(--t1)',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Folder */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Folder
        </label>
        <select
          value={folderId}
          onChange={e => setFolderId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--b2)',
            background: 'var(--s2)',
            color: 'var(--t1)',
            fontSize: 13,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        >
          <option value="">— No Folder —</option>
          {folders.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Comments toggle */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
          Allow Comments
        </label>
        <button
          onClick={() => setCommentsEnabled(!commentsEnabled)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            background: commentsEnabled ? 'var(--acc)' : 'var(--s3)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            padding: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#fff',
              left: commentsEnabled ? 22 : 2,
              top: 2,
              transition: 'left 0.2s',
            }}
          />
        </button>
      </div>

      {/* Player Mode */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Player Mode
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PLAYER_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setPlayerMode(mode.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 8,
                border: playerMode === mode.id ? '2px solid var(--acc)' : '1px solid var(--b2)',
                background: playerMode === mode.id ? 'rgba(79,110,247,0.08)' : 'var(--s2)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{mode.label}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{mode.desc}</div>
              </div>
              {playerMode === mode.id && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--acc)', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        style={{
          width: '100%',
          padding: '11px 16px',
          borderRadius: 8,
          background: hasChanges && !saving ? 'var(--acc)' : 'var(--s3)',
          color: hasChanges && !saving ? '#fff' : 'var(--t3)',
          border: 'none',
          fontSize: 13,
          fontWeight: 700,
          cursor: hasChanges && !saving ? 'pointer' : 'default',
          transition: 'all 0.2s',
          marginBottom: 20,
          opacity: saving ? 0.6 : 1,
        }}
        onMouseOver={e => {
          if (hasChanges && !saving) {
            e.currentTarget.style.background = '#3b55e0'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,110,247,0.4)'
          }
        }}
        onMouseOut={e => {
          if (hasChanges && !saving) {
            e.currentTarget.style.background = 'var(--acc)'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--b1)', margin: '24px 0' }} />

      {/* Duplicate button */}
      <button
        onClick={handleDuplicate}
        disabled={duplicating}
        style={{
          width: '100%',
          padding: '11px 16px',
          borderRadius: 8,
          background: duplicating ? 'var(--s3)' : 'var(--s2)',
          color: duplicating ? 'var(--t3)' : 'var(--t1)',
          border: '1px solid var(--b2)',
          fontSize: 13,
          fontWeight: 600,
          cursor: duplicating ? 'default' : 'pointer',
          transition: 'all 0.15s',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: duplicating ? 0.7 : 1,
        }}
        onMouseOver={e => {
          if (!duplicating) {
            e.currentTarget.style.background = 'var(--s3)'
            e.currentTarget.style.borderColor = 'var(--acc)'
            e.currentTarget.style.color = 'var(--acc)'
          }
        }}
        onMouseOut={e => {
          if (!duplicating) {
            e.currentTarget.style.background = 'var(--s2)'
            e.currentTarget.style.borderColor = 'var(--b2)'
            e.currentTarget.style.color = 'var(--t1)'
          }
        }}
      >
        {duplicating ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Duplicating...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            🔄 Duplicate Video
          </>
        )}
      </button>

      {/* Delete button */}
      {!deleteConfirm ? (
        <button
          onClick={() => setDeleteConfirm(true)}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: 8,
            background: 'var(--s2)',
            color: '#EF4444',
            border: '1px solid #FCA5A5',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#FEE2E2'
            e.currentTarget.style.borderColor = '#EF4444'
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'var(--s2)'
            e.currentTarget.style.borderColor = '#FCA5A5'
          }}
        >
          🗑 Delete Video
        </button>
      ) : (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#7F1D1D', marginBottom: 12 }}>
            Delete "{title}"?
          </div>
          <div style={{ fontSize: 12, color: '#B91C1C', marginBottom: 12 }}>
            This action cannot be undone. The video, all elements, and analytics will be permanently deleted.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setDeleteConfirm(false)}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 6,
                background: 'white',
                color: '#7F1D1D',
                border: '1px solid #FCA5A5',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#FEE2E2'}
              onMouseOut={e => e.currentTarget.style.background = 'white'}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 6,
                background: deleting ? 'var(--s3)' : '#EF4444',
                color: '#fff',
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: deleting ? 'default' : 'pointer',
                transition: 'all 0.15s',
                opacity: deleting ? 0.6 : 1,
              }}
              onMouseOver={e => {
                if (!deleting) {
                  e.currentTarget.style.background = '#DC2626'
                }
              }}
              onMouseOut={e => {
                if (!deleting) {
                  e.currentTarget.style.background = '#EF4444'
                }
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
