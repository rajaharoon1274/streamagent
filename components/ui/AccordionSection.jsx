'use client'
import { useState } from 'react'

// Used in: LP sidebar controls, branding panels, settings sections
// Matches the HTML's lpSection() pattern — collapsible section with header + content

export default function AccordionSection({
  id,
  label,
  icon,
  children,
  defaultOpen = true,
  // Optional: controlled mode (pass isOpen + onToggle)
  isOpen: controlledOpen,
  onToggle: controlledToggle,
}) {
  const [localOpen, setLocalOpen] = useState(defaultOpen)

  // Support both controlled and uncontrolled
  const isOpen  = controlledOpen !== undefined ? controlledOpen : localOpen
  const toggle  = controlledToggle || (() => setLocalOpen(v => !v))

  return (
    <div style={{ border: '1px solid var(--b2)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      {/* Header */}
      <div
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '9px 12px',
          cursor: 'pointer',
          background: 'var(--s2)',
          userSelect: 'none',
        }}
      >
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', flex: 1 }}>{label}</span>
        {/* Chevron */}
        <svg
          width={13} height={13} viewBox="0 0 24 24"
          fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: 12, background: 'var(--bg)', borderTop: '1px solid var(--b1)' }}>
          {children}
        </div>
      )}
    </div>
  )
}