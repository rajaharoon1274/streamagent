'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

/* ───────── data ───────── */
const CRM = [
  { name: 'HubSpot', desc: 'Create or update contacts on lead capture', color: '#FF7A59' },
  { name: 'Salesforce', desc: 'Add leads as new Leads or Contacts', color: '#00A1E0' },
  { name: 'Follow Up Boss', desc: 'Create leads with video activity data', color: '#FF6B35' },
  { name: 'GoHighLevel', desc: 'Create contacts with video data as custom fields', color: '#22C55E' },
  { name: 'Zoho CRM', desc: 'Add captured leads as new Leads automatically', color: '#E8461A' },
  { name: 'ClickFunnels', desc: 'Push leads into your ClickFunnels workspace', color: '#1C1C1C' },
]

const EMAIL = [
  { name: 'Mailchimp', desc: 'Add leads to a Mailchimp audience automatically', color: '#FFE01B' },
  { name: 'ActiveCampaign', desc: 'Add contacts and trigger automations', color: '#356AE6' },
  { name: 'Constant Contact', desc: 'Add captured leads to your lists', color: '#1B75BC' },
]

const WEBHOOKS = [
  { name: 'Slack', desc: 'Real-time lead notifications in your channel', color: '#611F69', type: 'oauth' },
  { name: 'Zapier', desc: 'Connect to 5,000+ apps via webhook', color: '#FF4A00', type: 'webhook', placeholder: 'https://hooks.zapier.com/...' },
  { name: 'Custom Webhook', desc: 'POST lead data to any HTTP endpoint', color: '#FF6B6B', type: 'webhook', placeholder: 'https://your-app.com/api/webhook' },
]

/* ───────── sub-components ───────── */

function ConnectCard({ item, connected, onConnect, onDisconnect }) {
  const isConn = !!connected
  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14,
      padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 130,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>{item.name}</div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConn ? 'var(--grn)' : 'var(--b3)' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5, marginBottom: 12 }}>
          {isConn ? (connected.account || 'Connected') : item.desc}
        </div>
      </div>
      {isConn ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--grn)' }}>● Connected</span>
          <button onClick={onDisconnect} style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', color: 'var(--red)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={onConnect} style={{
          width: '100%', padding: 8, borderRadius: 9,
          background: item.color, color: item.color === '#FFE01B' ? '#000' : '#fff',
          fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
        }}>Connect {item.name}</button>
      )}
    </div>
  )
}

function WebhookCard({ item, value, onChange, onSave }) {
  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14,
      padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 130,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>{item.name}</div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: (value || '').length > 6 ? 'var(--grn)' : 'var(--b3)' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5, marginBottom: 12 }}>{item.desc}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="prop-inp" placeholder={item.placeholder} value={value || ''} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11, marginBottom: 0 }} />
        <button onClick={onSave} style={{
          padding: '7px 14px', borderRadius: 8, background: item.color, color: '#fff',
          fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>Save</button>
      </div>
    </div>
  )
}

/* ───────── main ───────── */
export default function Integrations() {
  const [connected, setConnected] = useState({})
  const [webhooks, setWebhooks] = useState({})

  function connect(name) {
    setConnected(p => ({ ...p, [name]: { connected: true, account: `${name.toLowerCase()}@example.com` } }))
    toast.success(`${name} connected!`)
  }
  function disconnect(name) {
    setConnected(p => { const n = { ...p }; delete n[name]; return n })
    toast.success(`${name} disconnected`)
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 960, animation: 'fadeIn 0.18s ease' }}>
      <style jsx global>{`
        @media (max-width: 900px) {
          .integrations-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 901px) and (max-width: 1200px) {
          .integrations-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Integrations</div>
      <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 22 }}>Connect StreamAgent to your CRM, email marketing, and sales tools. Leads sync automatically on capture.</div>

      {/* What gets synced banner */}
      <div style={{ background: 'rgba(79,110,247,0.06)', border: '1px solid rgba(79,110,247,0.2)', borderRadius: 14, padding: '16px 18px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>What Gets Synced Automatically</div>
          <div style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.6 }}>
            When a lead is captured, StreamAgent sends:{' '}
            <strong style={{ color: 'var(--t1)' }}>name, email, phone, video watched, watch depth, branch taken, lead score, source/campaign,</strong>{' '}
            and <strong style={{ color: 'var(--t1)' }}>timestamp</strong> to all connected platforms.
          </div>
        </div>
      </div>

      {/* CRM */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>CRM</div>
      <div className="integrations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {CRM.map(t => (
          <ConnectCard key={t.name} item={t} connected={connected[t.name]}
            onConnect={() => connect(t.name)} onDisconnect={() => disconnect(t.name)} />
        ))}
      </div>

      {/* Email Marketing */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>Email Marketing</div>
      <div className="integrations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {EMAIL.map(t => (
          <ConnectCard key={t.name} item={t} connected={connected[t.name]}
            onConnect={() => connect(t.name)} onDisconnect={() => disconnect(t.name)} />
        ))}
      </div>

      {/* Notifications & Webhooks */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>Notifications &amp; Webhooks</div>
      <div className="integrations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {WEBHOOKS.map(t =>
          t.type === 'oauth' ? (
            <ConnectCard key={t.name} item={t} connected={connected[t.name]}
              onConnect={() => connect(t.name)} onDisconnect={() => disconnect(t.name)} />
          ) : (
            <WebhookCard key={t.name} item={t} value={webhooks[t.name] || ''}
              onChange={v => setWebhooks(p => ({ ...p, [t.name]: v }))}
              onSave={() => toast.success(`${t.name} webhook saved!`)} />
          )
        )}
      </div>
    </div>
  )
}
