'use client'
import { useState } from 'react'

function UrlRow({ icon, label, desc, url, accentColor, mono = '#4F6EF7', onEdit }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{label}</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>{desc}</div>
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              padding: '3px 9px', borderRadius: 6,
              background: 'var(--s3)', border: '1px solid var(--b2)',
              color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Edit
          </button>
        )}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--bg)', border: '1px solid var(--b2)',
        borderRadius: 7, padding: '6px 10px',
      }}>
        <span style={{
          fontFamily: 'var(--mono, monospace)', fontSize: 10,
          color: mono, flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {url}
        </span>
        <button
          onClick={copy}
          style={{
            padding: '3px 10px', borderRadius: 5,
            background: copied ? 'rgba(30,216,160,0.15)' : accentColor,
            border: copied ? '1px solid var(--grn)' : 'none',
            color: copied ? 'var(--grn)' : '#fff',
            fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export default function LinksCard({ video: v, accentColor, onTabSwitch }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://streamagent.io'

  // ── Use real slug from landing_pages table (set by Day 14 PATCH route) ──────
  // v.slug is returned by GET /api/videos/[id] and PATCH /api/videos/[id]
  const lpUrl = v.slug
    ? `${origin}/p/${v.slug}`
    : null   // null = not published yet

  const directUrl = `${origin}/watch/${v.id}`

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Links</div>
      </div>

      {lpUrl ? (
        <UrlRow
          icon="🌐"
          label="Landing Page"
          desc="Branded page with your video"
          url={lpUrl}
          accentColor={accentColor}
          mono="var(--acc)"
          onEdit={onTabSwitch ? () => onTabSwitch('landing') : undefined}
        />
      ) : (
        /* No slug yet — prompt user to save the landing page first */
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 15 }}>🌐</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Landing Page</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>Branded page with your video</div>
            </div>
          </div>
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'rgba(79,110,247,0.08)', border: '1px dashed var(--acc)',
            fontSize: 10, color: 'var(--t3)', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 8,
          }}>
            <span>Save your landing page first to generate a URL</span>
            {onTabSwitch && (
              <button
                onClick={() => onTabSwitch('landing')}
                style={{
                  padding: '3px 9px', borderRadius: 6, background: 'var(--acc)',
                  border: 'none', color: '#fff', fontSize: 10,
                  fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                }}
              >
                Set up →
              </button>
            )}
          </div>
        </div>
      )}

      <UrlRow
        icon="▶️"
        label="Direct Video Link"
        desc="Skips landing page, goes straight to player"
        url={directUrl}
        accentColor={accentColor}
        mono="var(--cyn)"
      />
    </div>
  )
}