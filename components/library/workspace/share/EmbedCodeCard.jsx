'use client'
import { useState } from 'react'

const EMBED_TYPES = [
  { id: 'script-inline', label: 'Script Tag',   desc: 'Best for websites & funnels' },
  { id: 'iframe',        label: 'iFrame',        desc: 'Universal, any platform' },
  { id: 'script-modal',  label: 'Modal Popup',   desc: 'Lightbox style embed' },
]

function getSnippet(type, id) {
  if (type === 'iframe')
    return `<iframe src="https://streamagent.io/embed/${id}" width="100%" style="aspect-ratio:16/9;border:none;border-radius:12px"></iframe>`
  if (type === 'script-modal')
    return `<script src="https://cdn.streamagent.io/modal.js" data-id="${id}" data-trigger="click"></script>`
  return `<script src="https://cdn.streamagent.io/embed.js" data-id="${id}"></script>`
}

export default function EmbedCodeCard({ video: v, accentColor }) {
  const [type,   setType]   = useState(v.shareEmbed || 'script-inline')
  const [copied, setCopied] = useState(false)

  const snippet = getSnippet(type, v.id)

  function copy() {
    navigator.clipboard?.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Embed Code</div>
        <button
          onClick={copy}
          style={{
            padding: '3px 10px', borderRadius: 6, background: copied ? 'rgba(30,216,160,0.1)' : 'var(--s3)',
            border: copied ? '1px solid var(--grn)' : '1px solid var(--b2)',
            color: copied ? 'var(--grn)' : 'var(--t2)', fontSize: 10, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>

      {/* Type picker */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--b1)' }}>
        {EMBED_TYPES.map((et, i) => {
          const active = type === et.id
          return (
            <div
              key={et.id}
              onClick={() => setType(et.id)}
              style={{
                flex: 1, padding: '8px 6px', textAlign: 'center', cursor: 'pointer',
                borderRight: i < EMBED_TYPES.length - 1 ? '1px solid var(--b1)' : 'none',
                background: active ? 'rgba(79,110,247,0.08)' : 'transparent',
                borderBottom: `2px solid ${active ? (accentColor || 'var(--acc)') : 'transparent'}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: active ? (accentColor || 'var(--acc)') : 'var(--t2)' }}>{et.label}</div>
              <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 1 }}>{et.desc}</div>
            </div>
          )
        })}
      </div>

      {/* Code block */}
      <div style={{ padding: '10px 12px', background: 'var(--bg)' }}>
        <pre style={{
          fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'var(--t2)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, lineHeight: 1.6,
        }}>
          {snippet}
        </pre>
      </div>
    </div>
  )
}
