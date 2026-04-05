'use client'
import { useApp } from '@/context/AppContext'
import { useState } from 'react'

export default function QuickActions({ video: v }) {
  const { set } = useApp()
  const [hovered, setHovered] = useState(null)

  const elCount = v.elements?.length ?? 0
  const lp      = v.lp  ?? {}
  const b       = v.branding ?? {}

  const CARDS = [
    {
      id:    'elements',
      icon:  '⚡',
      label: 'Add Elements',
      desc:  elCount > 0 ? `${elCount} element(s) added` : 'No elements yet',
      color: 'var(--acc)',
    },
    {
      id:    'landing',
      icon:  '🌐',
      label: 'Landing Page',
      desc:  lp._headlineCustomised ? 'Customised' : 'Using defaults',
      color: '#A855F7',
    },
    {
      id:    'branding',
      icon:  '🎨',
      label: 'Branding',
      desc:  b.logoUrl ? 'Custom logo set' : 'Default branding',
      color: '#F5A623',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
      {CARDS.map(card => (
        <div
          key={card.id}
          onClick={() => set({ videoDetailTab: card.id })}
          onMouseEnter={() => setHovered(card.id)}
          onMouseLeave={() => setHovered(null)}
          style={{
            background: 'var(--s2)',
            border: `1px solid ${hovered === card.id ? card.color + '44' : 'var(--b2)'}`,
            borderRadius: 12,
            padding: '14px 16px',
            cursor: 'pointer',
            transition: 'border-color 0.18s',
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>{card.label}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>{card.desc}</div>
        </div>
      ))}
    </div>
  )
}
