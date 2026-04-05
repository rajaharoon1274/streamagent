'use client'
import LinksCard      from './LinksCard'
import EmbedCodeCard  from './EmbedCodeCard'
import SocialShareCard from './SocialShareCard'
import QRCodeCard     from './QRCodeCard'
import GIFExport      from './GIFExport'

export default function ShareTab({ video: v, accentColor, onTabSwitch }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <LinksCard       video={v} accentColor={accentColor} onTabSwitch={onTabSwitch} />
      <EmbedCodeCard   video={v} accentColor={accentColor} />
      <SocialShareCard video={v} />
      <QRCodeCard      video={v} />
      <GIFExport       video={v} accentColor={accentColor} />
    </div>
  )
}
