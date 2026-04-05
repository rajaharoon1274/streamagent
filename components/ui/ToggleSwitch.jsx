'use client'

// Replaces the HTML's .toggle-sw CSS class pattern.
// HTML used: <div class="toggle-sw on/off" onclick="..."><div class="knob"></div></div>
// This component is the React equivalent — same visual output.

export default function ToggleSwitch({ value, onChange, disabled = false }) {
  return (
    <div
      onClick={() => { if (!disabled) onChange(!value) }}
      style={{
        width: 36,
        height: 20,
        borderRadius: 100,
        background: value ? 'var(--grn)' : 'var(--s4)',
        border: `1px solid ${value ? 'var(--grn)' : 'var(--b2)'}`,
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#fff',
          transform: value ? 'translateX(16px)' : 'translateX(0)',
          transition: 'transform 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  )
}