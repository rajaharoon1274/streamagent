'use client'
import PlayerPreview from './PlayerPreview'

// BrandingTab is now preview-only.
// All controls live in WorkspaceSidebar (BrandingSidebarContent).
// State (b, onChange) is lifted to VideoWorkspace and passed down here.

export default function BrandingTab({ video: v, b, aspectRatio }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
    }}>
      {/* Preview header */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>Live Preview</div>
        <div style={{ fontSize: 10, color: 'var(--t3)' }}>Updates as you change settings in the left panel</div>
      </div>

      {/* Player preview */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', padding: 40,
      }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <PlayerPreview b={b} aspectRatio={aspectRatio || v?.aspectRatio || '16:9'} />
        </div>
      </div>
    </div>
  )
}