'use client'
import { useEffect, useState, useCallback } from 'react'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

/* ─── SWR fetcher ─── */
const fetcher = (url) => fetch(url).then((r) => r.json())

/* ─── Provider display config — all original cards preserved ─── */
const CRM = [
  { name: 'HubSpot', provider: 'hubspot', desc: 'Create or update contacts on lead capture', color: '#FF7A59', auth: 'oauth' },
  { name: 'Salesforce', provider: null, desc: 'Add leads as new Leads or Contacts', color: '#00A1E0', auth: 'soon' },
  { name: 'Follow Up Boss', provider: 'followupboss', desc: 'Create leads with video activity data', color: '#FF6B35', auth: 'api_key' },
  { name: 'GoHighLevel', provider: 'ghl', desc: 'Create contacts with video data as custom fields', color: '#22C55E', auth: 'oauth' },
  { name: 'Zoho CRM', provider: null, desc: 'Add captured leads as new Leads automatically', color: '#E8461A', auth: 'soon' },
  { name: 'ClickFunnels', provider: null, desc: 'Push leads into your ClickFunnels workspace', color: '#1C1C1C', auth: 'soon' },
]

const EMAIL = [
  { name: 'Mailchimp', provider: 'mailchimp', desc: 'Add leads to a Mailchimp audience automatically', color: '#FFE01B', auth: 'oauth' },
  { name: 'ActiveCampaign', provider: 'activecampaign', desc: 'Add contacts and trigger automations', color: '#356AE6', auth: 'api_key' },
  { name: 'Constant Contact', provider: null, desc: 'Add captured leads to your lists', color: '#1B75BC', auth: 'soon' },
]

const WEBHOOKS_STATIC = [
  { name: 'Slack', provider: 'slack', desc: 'Real-time lead notifications in your channel', color: '#611F69', auth: 'oauth' },
]

/* ══ ConnectCard — OAuth providers (live) ═══════════════════════════════ */
function ConnectCard({ item, integration, onConnect, onDisconnect }) {
  const isConn = !!integration?.connected
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
          {isConn ? (integration.account || 'Connected') : item.desc}
        </div>
      </div>
      {isConn ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--grn)' }}>● Connected</span>
          <button onClick={() => onDisconnect(item.provider)} style={{
            padding: '5px 12px', borderRadius: 7,
            background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
            color: 'var(--red)', fontSize: 10, fontWeight: 600, cursor: 'pointer',
          }}>Disconnect</button>
        </div>
      ) : (
        <button onClick={() => onConnect(item.provider)} style={{
          width: '100%', padding: 8, borderRadius: 9,
          background: item.color, color: item.color === '#FFE01B' ? '#000' : '#fff',
          fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
        }}>Connect {item.name}</button>
      )}
    </div>
  )
}

/* ══ ApiKeyCard — FollowUpBoss, ActiveCampaign ═══════════════════════════ */
function ApiKeyCard({ item, integration, onSaveKey, onDisconnect }) {
  const isConn = !!integration?.connected
  const needsUrl = item.provider === 'activecampaign'
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!apiKey.trim()) { toast.error('API key is required'); return }
    if (needsUrl && !apiUrl.trim()) { toast.error('Account URL is required'); return }
    setSaving(true)
    await onSaveKey(item.provider, apiKey.trim(), needsUrl ? apiUrl.trim() : null)
    setSaving(false)
    setApiKey('')
    setApiUrl('')
  }

  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14,
      padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: isConn ? 130 : (needsUrl ? 178 : 148),
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>{item.name}</div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConn ? 'var(--grn)' : 'var(--b3)' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5, marginBottom: 12 }}>
          {isConn ? 'API key connected' : item.desc}
        </div>
      </div>
      {isConn ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--grn)' }}>● Connected</span>
          <button onClick={() => onDisconnect(item.provider)} style={{
            padding: '5px 12px', borderRadius: 7,
            background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
            color: 'var(--red)', fontSize: 10, fontWeight: 600, cursor: 'pointer',
          }}>Disconnect</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {needsUrl && (
            <input className="prop-inp" value={apiUrl} onChange={e => setApiUrl(e.target.value)}
              placeholder="https://youraccountname.api-us1.com"
              style={{ fontFamily: 'var(--mono)', fontSize: 11, marginBottom: 0 }} />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="prop-inp" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="Paste API key…" type="password"
              style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11, marginBottom: 0 }} />
            <button onClick={handleSave} disabled={saving} style={{
              padding: '7px 14px', borderRadius: 8,
              background: item.color, color: item.color === '#FFE01B' ? '#000' : '#fff',
              fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{saving ? '…' : 'Save'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══ ComingSoonCard — Salesforce, Zoho, ClickFunnels, Constant Contact ══ */
function ComingSoonCard({ item }) {
  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14,
      padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 130,
      opacity: 0.6,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>{item.name}</div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--b3)' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5, marginBottom: 12 }}>{item.desc}</div>
      </div>
      <button disabled style={{
        width: '100%', padding: 8, borderRadius: 9,
        background: item.color, color: item.color === '#FFE01B' ? '#000' : '#fff',
        fontSize: 11, fontWeight: 700, border: 'none', cursor: 'not-allowed', opacity: 0.5,
      }}>Coming Soon</button>
    </div>
  )
}

/* ══ WebhookCard — Zapier + Custom Webhook (original style) ══════════════ */
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

/* ══ Main ════════════════════════════════════════════════════════════════ */
export default function Integrations() {
  const searchParams = useSearchParams()
  const { data, mutate, isLoading } = useSWR('/api/integrations', fetcher, { revalidateOnFocus: false })
  // Local state for Zapier / Custom Webhook URL inputs (saved to webhook_endpoints table)
  const [webhookUrls, setWebhookUrls] = useState({ Zapier: '', 'Custom Webhook': '' })

  const integrations = data?.integrations || []
  const savedWebhooks = data?.webhooks || []

  // Pre-fill Zapier / Custom Webhook inputs from saved webhook_endpoints
  useEffect(() => {
    if (!savedWebhooks.length) return
    const zapier = savedWebhooks.find(w => w.name === 'Zapier')
    const custom = savedWebhooks.find(w => w.name === 'Custom Webhook')
    setWebhookUrls({
      Zapier: zapier?.url || '',
      'Custom Webhook': custom?.url || '',
    })
  }, [savedWebhooks])

  // Handle OAuth redirect back from provider
  useEffect(() => {
    const connected = searchParams?.get('connected')
    const err = searchParams?.get('error')
    if (connected) {
      const found = [...CRM, ...EMAIL, ...WEBHOOKS_STATIC].find(i => i.provider === connected)
      toast.success(`${found?.name || connected} connected!`)
      window.history.replaceState({}, '', window.location.pathname)
      mutate()
    }
    if (err) {
      toast.error(`Connection failed: ${err}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams, mutate])

  /* ─ helpers ─ */
  const getIntegration = (provider) => integrations.find((i) => i.provider === provider)

  /* ─ OAuth connect ─ */
  const handleConnect = useCallback(async (provider) => {
    const t = toast.loading('Connecting…')
    try {
      const res = await fetch(`/api/integrations/connect/${provider}`, { method: 'POST' })
      const json = await res.json()
      toast.dismiss(t)
      if (!res.ok) { toast.error(json.error || 'Connection failed'); return }
      if (json.redirect_url) { window.location.href = json.redirect_url }
      else { toast.success('Connected!'); mutate() }
    } catch { toast.dismiss(t); toast.error('Connection failed') }
  }, [mutate])

  /* ─ API key save ─ */
  const handleSaveKey = useCallback(async (provider, api_key, api_url) => {
    const t = toast.loading('Saving…')
    try {
      const res = await fetch(`/api/integrations/connect/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key, api_url }),
      })
      const json = await res.json()
      toast.dismiss(t)
      if (!res.ok) { toast.error(json.error || 'Failed to save'); return }
      const found = [...CRM, ...EMAIL].find(i => i.provider === provider)
      toast.success(`${found?.name || provider} connected!`)
      mutate()
    } catch { toast.dismiss(t); toast.error('Failed to save') }
  }, [mutate])

  /* ─ Disconnect ─ */
  const handleDisconnect = useCallback(async (provider) => {
    const t = toast.loading('Disconnecting…')
    try {
      const res = await fetch(`/api/integrations/${provider}`, { method: 'DELETE' })
      const json = await res.json()
      toast.dismiss(t)
      if (!res.ok) { toast.error(json.error || 'Failed'); return }
      const found = [...CRM, ...EMAIL, ...WEBHOOKS_STATIC].find(i => i.provider === provider)
      toast.success(`${found?.name || provider} disconnected`)
      mutate()
    } catch { toast.dismiss(t); toast.error('Failed to disconnect') }
  }, [mutate])

  /* ─ Save Zapier / Custom Webhook URL ─ */
  const handleSaveWebhookUrl = useCallback(async (name, url) => {
    if (!url || url.length < 7) { toast.error('Enter a valid URL'); return }
    // Check if this named webhook already exists
    const existing = savedWebhooks.find(w => w.name === name)
    if (existing) {
      // Update
      const res = await fetch(`/api/webhooks/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) { toast.error('Failed to save webhook'); return }
    } else {
      // Create
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, events: ['lead.created'] }),
      })
      if (!res.ok) { toast.error('Failed to save webhook'); return }
    }
    toast.success(`${name} webhook saved!`)
    mutate()
  }, [savedWebhooks, mutate])

  /* ─ Render a single card based on its auth type ─ */
  function renderCard(item) {
    if (item.auth === 'soon') return <ComingSoonCard key={item.name} item={item} />
    if (item.auth === 'api_key') {
      return (
        <ApiKeyCard key={item.name} item={item}
          integration={getIntegration(item.provider)}
          onSaveKey={handleSaveKey} onDisconnect={handleDisconnect} />
      )
    }
    // oauth
    return (
      <ConnectCard key={item.name} item={item}
        integration={getIntegration(item.provider)}
        onConnect={handleConnect} onDisconnect={handleDisconnect} />
    )
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 960, animation: 'fadeIn 0.18s ease' }}>
      <style jsx global>{`
        @media (max-width: 900px) {
          .integrations-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 901px) and (max-width: 1200px) {
          .integrations-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Integrations</div>
      <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 22 }}>
        Connect StreamAgent to your CRM, email marketing, and sales tools. Leads sync automatically on capture.
      </div>

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

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)', fontSize: 13 }}>Loading integrations…</div>
      )}

      {!isLoading && <>
        {/* CRM */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>CRM</div>
        <div className="integrations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {CRM.map(renderCard)}
        </div>

        {/* Email Marketing */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>Email Marketing</div>
        <div className="integrations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {EMAIL.map(renderCard)}
        </div>

        {/* Notifications & Webhooks */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>Notifications &amp; Webhooks</div>
        <div className="integrations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

          {/* Slack — OAuth connect card */}
          {WEBHOOKS_STATIC.map(renderCard)}

          {/* Zapier — original WebhookCard style, now saves to DB */}
          <WebhookCard
            item={{ name: 'Zapier', desc: 'Connect to 5,000+ apps via webhook', color: '#FF4A00', placeholder: 'https://hooks.zapier.com/...' }}
            value={webhookUrls['Zapier']}
            onChange={v => setWebhookUrls(p => ({ ...p, Zapier: v }))}
            onSave={() => handleSaveWebhookUrl('Zapier', webhookUrls['Zapier'])}
          />

          {/* Custom Webhook — original WebhookCard style, now saves to DB */}
          <WebhookCard
            item={{ name: 'Custom Webhook', desc: 'POST lead data to any HTTP endpoint', color: '#FF6B6B', placeholder: 'https://your-app.com/api/webhook' }}
            value={webhookUrls['Custom Webhook']}
            onChange={v => setWebhookUrls(p => ({ ...p, 'Custom Webhook': v }))}
            onSave={() => handleSaveWebhookUrl('Custom Webhook', webhookUrls['Custom Webhook'])}
          />
        </div>
      </>}
    </div>
  )
}