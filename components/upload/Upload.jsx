'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { useFolders } from '@/hooks/useFolders'
import Icon from '@/components/ui/Icon'
import toast from 'react-hot-toast'
import * as tus from 'tus-js-client'

const AFTER_ACTIONS = [
  { id: 'elements', icon: '\u26A1', label: 'Add Interactive Elements', desc: 'Add gates, CTAs, and choice points' },
  { id: 'landing', icon: '\uD83C\uDF10', label: 'Set Up Landing Page', desc: 'Customize the page viewers land on' },
  { id: 'library', icon: '\uD83D\uDCC1', label: 'Just Save to Library', desc: 'Add elements and landing page later' },
]

export default function Upload() {
  const { state, set, goto } = useApp()
  const router = useRouter()
  const { folders } = useFolders()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [privacy, setPrivacy] = useState('Private')
  const [folderId, setFolderId] = useState('')
  const [tags, setTags] = useState('')
  const [afterAction, setAfterAction] = useState('library')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileRef = useRef()

  // Warn user if they try to close tab during upload
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (uploading && !done) {
        e.preventDefault()
        e.returnValue = '' // required for Chrome
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [uploading, done])

  function handleFile(file) {
    if (!file) return
    setSelectedFile(file)
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
  }

  async function startUpload() {
    // If no file selected, open picker first
    if (!selectedFile) {
      fileRef.current?.click()
      return
    }

    // Client-side file validation
    const ACCEPTED = ['video/mp4','video/quicktime','video/x-msvideo','video/webm','video/x-matroska']
    const MAX_SIZE = 10 * 1024 * 1024 * 1024 // 10 GB

    if (!ACCEPTED.includes(selectedFile.type) &&
        !selectedFile.name.match(/\.(mp4|mov|avi|webm|mkv)$/i)) {
      toast.error('Please select a video file (.mp4, .mov, .avi, .webm, or .mkv)')
      return
    }

    if (selectedFile.size > MAX_SIZE) {
      toast.error('File too large. Maximum size is 10GB.')
      return
    }

    setUploading(true)
    setProgress(0)
    set({ uploadInProgress: true })

    try {
      // Step 1: Create DB record + get CF upload URL
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          title: title.trim() || selectedFile.name.replace(/\.[^.]+$/, ''),
          folderId: folderId || null,
        }),
      })

      const data = await res.json()

      // Handle plan limit error
      if (res.status === 403 && data.code === 'PLAN_LIMIT_REACHED') {
        setUploading(false)
        set({ uploadInProgress: false })
        toast.error(data.error)
        return
      }

      // Handle auth error
      if (res.status === 401) {
        setUploading(false)
        set({ uploadInProgress: false })
        toast.error('Your session has expired. Please log in again.')
        return
      }

      if (!res.ok) {
        setUploading(false)
        set({ uploadInProgress: false })
        toast.error(data.error || 'Upload failed to start. Please try again.')
        return
      }

      const { uploadUrl } = data

      // Step 2: Upload directly to Cloudflare via TUS
      await new Promise((resolve, reject) => {
        const upload = new tus.Upload(selectedFile, {
          uploadUrl,                    // direct upload URL from Cloudflare
          retryDelays: [0, 3000, 5000, 10000],
          metadata: {
            filename: selectedFile.name,
            filetype: selectedFile.type || 'video/mp4',
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const pct = Math.round((bytesUploaded / bytesTotal) * 100)
            setProgress(pct)
          },
          onSuccess: () => resolve(),
          onError: (err) => {
            reject(new Error(err.message || 'Network error during upload'))
          },
        })
        upload.start()
      })

      // Step 3: Upload received by Cloudflare
      setDone(true)
      set({ uploadInProgress: false })
      toast.success(`“${title || selectedFile.name}” uploaded! Processing now — ready in ~1 minute.`)

      // In M1, all afterAction options go to library
      setTimeout(() => {
        router.push('/library')
      }, 1800)

    } catch (err) {
      console.error('[Upload] Error:', err.message)
      setUploading(false)
      set({ uploadInProgress: false })
      toast.error('Upload failed. Please check your connection and try again.')
    }
  }

  function reset() {
    setUploading(false)
    setProgress(0)
    setDone(false)
    setSelectedFile(null)
    setTitle('')
  }

  if (uploading) {
    return (
      <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 18, padding: '44px 36px', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
          {done ? (
            <>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(30,216,160,0.12)', border: '1px solid rgba(30,216,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
                \u2713
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>Upload Complete!</div>
              <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 24 }}>Your video is processing, ready in ~2 minutes</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={reset} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid var(--b2)', background: 'var(--s3)', fontSize: 12, fontWeight: 600, color: 'var(--t2)', cursor: 'pointer' }}>
                  Upload Another
                </button>
                <button onClick={() => router.push('/library')} style={{ padding: '9px 20px', borderRadius: 9, background: 'var(--acc)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  View in Library
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>Uploading\u2026</div>
              <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 24 }}>Don't close this tab</div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,var(--acc),var(--pur))', borderRadius: 3, transition: 'width 0.15s' }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--acc)' }}>{progress}%</div>
              {selectedFile && (
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--t3)' }}>{selectedFile.name}</div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 580, margin: '0 auto' }}>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--acc)' : selectedFile ? 'rgba(30,216,160,0.5)' : 'var(--b2)'}`,
          borderRadius: 18, padding: '44px 36px', textAlign: 'center',
          background: dragOver ? 'rgba(79,110,247,0.04)' : selectedFile ? 'rgba(30,216,160,0.04)' : 'var(--s2)',
          cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s',
        }}
      >
        <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(79,110,247,0.12)', border: '1px solid rgba(79,110,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          {selectedFile
            ? <span style={{ fontSize: 24 }}>{'\uD83C\uDFAC'}</span>
            : <Icon name="upload" size={24} color="var(--acc)" />
          }
        </div>
        {selectedFile ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--grn)', marginBottom: 4 }}>{'\u2713'} {selectedFile.name}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB {'\u00B7'} Click to change</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>Drop your video here</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>MP4, MOV, AVI, WebM up to 10GB</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['4K Supported', 'Auto-transcoding', 'Interactive CTAs'].map(t => (
                <span key={t} style={{ fontSize: 10, fontWeight: 700, color: 'var(--acc)', background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.2)', padding: '3px 9px', borderRadius: 100 }}>{t}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Video details */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 14, paddingBottom: 11, borderBottom: '1px solid var(--b1)' }}>Video Details</div>

        <label className="prop-lbl">Title</label>
        <input className="prop-inp" style={{ marginBottom: 11 }} placeholder="My Awesome Video" value={title} onChange={e => setTitle(e.target.value)} />

        <label className="prop-lbl">Description</label>
        <textarea className="prop-inp" rows={2} style={{ resize: 'vertical', marginBottom: 11, lineHeight: 1.5 }} placeholder="What is this video about?" value={description} onChange={e => setDescription(e.target.value)} />

        <div className="upload-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 11 }}>
          <div>
            <label className="prop-lbl">Privacy</label>
            <select className="prop-inp" value={privacy} onChange={e => setPrivacy(e.target.value)}>
              <option>Private</option>
              <option>Public</option>
              <option>Password Protected</option>
            </select>
          </div>
          <div>
            <label className="prop-lbl">Folder</label>
            <select className="prop-inp" value={folderId} onChange={e => setFolderId(e.target.value)}>
              <option value="">{'\u2014'} No folder {'\u2014'}</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="prop-lbl">Tags (comma separated)</label>
        <input className="prop-inp" style={{ marginBottom: 0 }} placeholder="e.g. buyer, lead-gen, intro" value={tags} onChange={e => setTags(e.target.value)} />
      </div>

      {/* After upload action */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 14, paddingBottom: 11, borderBottom: '1px solid var(--b1)' }}>After Upload</div>
        <label className="prop-lbl" style={{ marginBottom: 8, display: 'block' }}>What do you want to do first?</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {AFTER_ACTIONS.map(a => (
            <div
              key={a.id}
              onClick={() => setAfterAction(a.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderRadius: 10, cursor: 'pointer',
                background: afterAction === a.id ? 'rgba(79,110,247,0.1)' : 'var(--s3)',
                border: `1px solid ${afterAction === a.id ? 'var(--acc)' : 'var(--b2)'}`,
                transition: 'all 0.1s',
              }}
            >
              <div style={{ fontSize: 20 }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{a.label}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{a.desc}</div>
              </div>
              {afterAction === a.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--acc)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={startUpload}
        style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--acc)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <Icon name="upload" size={14} color="#fff" />
        Upload & Continue
      </button>
    </div>
  )
}
