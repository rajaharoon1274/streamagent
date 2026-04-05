'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import toast from 'react-hot-toast'

const TABS = ['Account', 'Lead Routing', 'Video Import', 'API Keys', 'Plan']

/* ───────── shared flash-button helper ───────── */
function FlashButton({ onClick, idleLabel, doneLabel, idleStyle, doneStyle }) {
  const [done, setDone] = useState(false)
  function handle() {
    if (onClick) onClick()
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }
  return (
    <button onClick={handle} style={done ? doneStyle : idleStyle}>
      {done ? doneLabel : idleLabel}
    </button>
  )
}

/* ═══════════════════════════════════════════════════
   ACCOUNT TAB
   ═══════════════════════════════════════════════════ */
function AccountTab() {
  const { state, set } = useApp()
  const acct = state.account || { firstName: 'Justin', lastName: 'D.', email: 'justin@techdrivenagent.com', company: 'Tech Driven Agent', phone: '(310) 555-1234', timezone: 'America/Los_Angeles' }
  const [profile, setProfile] = useState({ ...acct })
  const [twoFA, setTwoFA] = useState(false)

  function upd(k, v) { setProfile(p => ({ ...p, [k]: v })) }

  const initials = ((profile.firstName || '')[0] || '') + ((profile.lastName || '')[0] || '')

  return (
    <div>
      {/* Profile card */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--b1)' }}>Profile</div>

        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#06B6D4,#4F6EF7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {initials.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{profile.firstName} {profile.lastName}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{profile.email}</div>
            <div style={{ marginTop: 8 }}>
              <button style={{ padding: '5px 12px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Upload Photo</button>
            </div>
          </div>
        </div>

        {/* Name row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label className="prop-lbl">First Name</label><input className="prop-inp" value={profile.firstName || ''} onChange={e => upd('firstName', e.target.value)} style={{ marginTop: 4 }} /></div>
          <div><label className="prop-lbl">Last Name</label><input className="prop-inp" value={profile.lastName || ''} onChange={e => upd('lastName', e.target.value)} style={{ marginTop: 4 }} /></div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <label className="prop-lbl">Email Address</label>
          <input className="prop-inp" type="email" value={profile.email || ''} onChange={e => upd('email', e.target.value)} style={{ marginTop: 4 }} />
        </div>

        {/* Company + Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label className="prop-lbl">Company</label><input className="prop-inp" value={profile.company || ''} onChange={e => upd('company', e.target.value)} style={{ marginTop: 4 }} /></div>
          <div><label className="prop-lbl">Phone</label><input className="prop-inp" value={profile.phone || ''} onChange={e => upd('phone', e.target.value)} style={{ marginTop: 4 }} /></div>
        </div>

        {/* Timezone */}
        <div style={{ marginBottom: 16 }}>
          <label className="prop-lbl">Timezone</label>
          <select className="prop-inp" value={profile.timezone || 'America/Los_Angeles'} onChange={e => upd('timezone', e.target.value)} style={{ marginTop: 4 }}>
            {[
              ['America/New_York', 'Eastern (ET)'],
              ['America/Chicago', 'Central (CT)'],
              ['America/Denver', 'Mountain (MT)'],
              ['America/Los_Angeles', 'Pacific (PT)'],
              ['America/Anchorage', 'Alaska (AKT)'],
              ['Pacific/Honolulu', 'Hawaii (HT)'],
              ['Europe/London', 'London (GMT)'],
              ['Europe/Paris', 'Paris (CET)'],
              ['Asia/Tokyo', 'Tokyo (JST)'],
              ['Australia/Sydney', 'Sydney (AEST)'],
            ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <FlashButton
          onClick={() => set({ account: profile })}
          idleLabel="Save Profile"
          doneLabel="✓ Saved"
          idleStyle={{ padding: '9px 20px', borderRadius: 9, background: 'var(--acc)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
          doneStyle={{ padding: '9px 20px', borderRadius: 9, background: 'var(--grn)', color: '#071a14', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
        />
      </div>

      {/* Security card */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--b1)' }}>Security</div>

        <div style={{ marginBottom: 14 }}>
          <label className="prop-lbl">Current Password</label>
          <input className="prop-inp" type="password" placeholder="Enter current password" style={{ marginTop: 4 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div><label className="prop-lbl">New Password</label><input className="prop-inp" type="password" placeholder="Min 8 characters" style={{ marginTop: 4 }} /></div>
          <div><label className="prop-lbl">Confirm Password</label><input className="prop-inp" type="password" placeholder="Re-enter new password" style={{ marginTop: 4 }} /></div>
        </div>

        <FlashButton
          idleLabel="Update Password"
          doneLabel="✓ Password Updated"
          idleStyle={{ padding: '8px 16px', borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          doneStyle={{ padding: '8px 16px', borderRadius: 9, background: 'var(--grn)', color: '#071a14', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
        />

        {/* 2FA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', marginTop: 14, borderTop: '1px solid var(--b1)' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Two-Factor Authentication</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Add an extra layer of security to your account</div>
          </div>
          <ToggleSwitch value={twoFA} onChange={setTwoFA} />
        </div>
        {twoFA && (
          <div style={{ background: 'rgba(30,216,160,0.06)', border: '1px solid rgba(30,216,160,0.15)', borderRadius: 9, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--grn)' }} />
            <span style={{ fontSize: 11, color: 'var(--grn)', fontWeight: 600 }}>Enabled — authenticator app required on login</span>
          </div>
        )}

        {/* Active sessions */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', marginBottom: 10 }}>Active Sessions</div>
          {[
            { device: 'Chrome on macOS', loc: 'Santa Monica, CA', time: 'Now', current: true },
            { device: 'Safari on iPhone', loc: 'Santa Monica, CA', time: '2 hours ago', current: false },
          ].map(s => (
            <div key={s.device} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--b1)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                {s.current ? '🖥' : '📱'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.device}
                  {s.current && <span style={{ fontSize: 9, color: 'var(--grn)', background: 'rgba(30,216,160,0.1)', padding: '1px 6px', borderRadius: 100 }}>This device</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{s.loc} · {s.time}</div>
              </div>
              {!s.current && (
                <button style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', color: 'var(--red)', fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>Revoke</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ background: 'rgba(255,107,107,0.04)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', marginBottom: 12 }}>Danger Zone</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,107,107,0.1)' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Export All Data</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>Download all your videos, leads, and settings</div>
          </div>
          <button style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Export</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Delete Account</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>Permanently delete your account and all data</div>
          </div>
          <button style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: 'var(--red)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   LEAD ROUTING TAB
   ═══════════════════════════════════════════════════ */
function LeadRoutingTab() {
  const { goto } = useApp() || {}

  return (
    <div>
      {/* Info banner */}
      <div style={{ background: 'rgba(79,110,247,0.07)', border: '1px solid rgba(79,110,247,0.2)', borderRadius: 12, padding: '13px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        <div style={{ fontSize: 20 }}>⚡</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--t1)' }}>Lead Routing</strong> controls where captured leads are sent when a gate fires. StreamAgent CRM is always on. Toggle additional destinations to sync leads to your connected platforms in real time.
        </div>
      </div>

      {/* Default Destinations card */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Default Destinations</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Applied to all gates unless overridden per-element</div>
        </div>

        {/* StreamAgent CRM row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(79,110,247,0.12)', border: '1px solid rgba(79,110,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>👥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>StreamAgent CRM</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>Built-in — all leads stored here automatically</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--grn)', background: 'rgba(30,216,160,0.1)', padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(30,216,160,0.2)' }}>✓ Always On</div>
        </div>

        {/* No integrations connected */}
        <div style={{ padding: '24px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>🔒</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', marginBottom: 6 }}>No integrations connected yet</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.6 }}>
            Connect Mailchimp, HubSpot, Follow Up Boss or other platforms in the Integrations tab first.
          </div>
          <button style={{ padding: '9px 20px', borderRadius: 9, background: 'var(--acc)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Go to Integrations →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   VIDEO IMPORT TAB
   ═══════════════════════════════════════════════════ */
function VideoImportTab() {
  const [oauth, setOauth] = useState({})
  const [wistiaKey, setWistiaKey] = useState('')

  const vimeoConn = !!(oauth.vimeoOAuth && oauth.vimeoOAuth.connected)
  const wistiaConn = wistiaKey.length > 6

  function connectVimeo() { setOauth(p => ({ ...p, vimeoOAuth: { connected: true, account: 'Vimeo Account' } })); toast.success('Vimeo connected!') }
  function disconnectVimeo() { setOauth(p => { const n = { ...p }; delete n.vimeoOAuth; return n }) }

  return (
    <div>
      <div style={{ background: 'rgba(79,110,247,0.06)', border: '1px solid rgba(79,110,247,0.2)', borderRadius: 14, padding: '16px 18px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
          Connect Vimeo or Wistia to import your existing video library directly into StreamAgent. Your videos, interactive — instantly.
        </div>
      </div>

      {/* Vimeo */}
      <div style={{ background: 'var(--s2)', border: `1px solid ${vimeoConn ? '#1AB7EA44' : 'var(--b2)'}`, borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: '#1AB7EA18', border: '1px solid #1AB7EA28', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎥</div>
          <div style={{ flex: 1 }}>
            <div className="sa-h3">Vimeo</div>
            <div className="sa-sub">{vimeoConn ? 'Vimeo Account' : 'Import videos from your Vimeo library via OAuth'}</div>
          </div>
          {vimeoConn ? (
            <button onClick={disconnectVimeo} style={{ padding: '6px 13px', borderRadius: 8, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', color: 'var(--red)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Disconnect</button>
          ) : (
            <button onClick={connectVimeo} style={{ padding: '6px 14px', borderRadius: 8, background: '#1AB7EA', color: '#fff', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Connect</button>
          )}
        </div>
        {vimeoConn ? (
          <div style={{ marginTop: 11, padding: '9px 12px', background: 'rgba(30,216,160,0.06)', borderRadius: 9, border: '1px solid rgba(30,216,160,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--grn)' }} />
            <span style={{ fontSize: 11, color: 'var(--grn)', fontWeight: 600 }}>Active — leads and events syncing</span>
          </div>
        ) : (
          <div style={{ marginTop: 11, fontSize: 10, color: 'var(--t3)', lineHeight: 1.5 }}>🔒 Uses OAuth — you'll be redirected to Vimeo to approve access. Vimeo Basic, Plus, Pro, Business and Premium supported.</div>
        )}
      </div>

      {/* Wistia */}
      <div style={{ background: 'var(--s2)', border: `1px solid ${wistiaConn ? '#4F9EF7aa' : 'var(--b2)'}`, borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: '#4F9EF718', border: '1px solid #4F9EF733', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎬</div>
          <div style={{ flex: 1 }}>
            <div className="sa-h3">Wistia</div>
            <div className="sa-sub">{wistiaConn ? 'Connected — ready to import' : 'Import videos from your Wistia account using an API token'}</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: wistiaConn ? 'rgba(30,216,160,0.12)' : 'rgba(100,116,139,0.12)', color: wistiaConn ? 'var(--grn)' : 'var(--t3)' }}>
            {wistiaConn ? '● Connected' : 'Not connected'}
          </div>
        </div>
        <label className="prop-lbl">Wistia API Token</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input className="prop-inp" type="password" value={wistiaKey} placeholder="Paste your Wistia API token..."
            onChange={e => setWistiaKey(e.target.value)}
            style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11 }} />
          <button onClick={() => toast.success('Wistia key saved!')} style={{ padding: '8px 14px', borderRadius: 9, background: 'var(--acc)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Save</button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.6 }}>
          💡 Find your API token in Wistia Account Settings → API Access. Use a token with <code style={{ background: 'var(--s3)', padding: '1px 5px', borderRadius: 3, fontFamily: 'var(--mono)' }}>read</code> scope.
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   API KEYS TAB
   ═══════════════════════════════════════════════════ */
const API_KEYS_DATA = [
  { name: 'Production', key: '••••••••••••••••••••••••••••••••••••••', created: 'Jan 3 2026', lastUsed: '2 hours ago', color: '#1ED8A0' },
  { name: 'Embed SDK',  key: '••••••••••••••••••••••••••••••••••••••', created: 'Jan 3 2026', lastUsed: '5 min ago',   color: '#4F6EF7' },
]

function APIKeysTab() {
  return (
    <div>
      <div style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 14, padding: '16px 18px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🔑</span>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
          Your StreamAgent API keys let you connect external tools and your embed SDK. Treat these like passwords — never share them publicly.
        </div>
      </div>

      <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="sa-h3">API Keys</span>
          <button onClick={() => toast.success('New key created!')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 8, background: 'var(--acc)', color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>+ New Key</button>
        </div>
        {API_KEYS_DATA.map(k => (
          <div key={k.name} style={{ padding: '14px 18px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                <span className="sa-h4">{k.name}</span>
                <span style={{ fontSize: 9, background: k.color + '18', color: k.color, borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>LIVE</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t3)' }}>{k.key.slice(0, 18)}••••••••••••••••</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>Created {k.created} · Last used {k.lastUsed}</div>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText(k.key); toast.success('Copied!') }}
              style={{ padding: '5px 11px', borderRadius: 7, background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--t2)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>📋 Copy</button>
            <button style={{ padding: '5px 11px', borderRadius: 7, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', color: 'var(--red)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Revoke</button>
          </div>
        ))}
        <div style={{ padding: '13px 18px', background: 'var(--s3)', fontSize: 11, color: 'var(--t3)', lineHeight: 1.6 }}>
          💡 Use your Embed SDK key in the <code style={{ color: 'var(--acc)', fontFamily: 'var(--mono)' }}>data-sa-key</code> attribute. Never expose your Production key on a public page.
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   PLAN TAB
   ═══════════════════════════════════════════════════ */
const PLANS = [
  {
    name: 'Core', price: 49, color: '#06B6D4', current: true,
    tagline: 'Everything you need to get started',
    storage: '500 GB', videos: '50',
    features: [
      '50 videos at 4K', '10 active StreamRoutes', 'All 24 interactive elements',
      'Customizable player + branding', 'Landing pages', '2,500 leads/month',
      'Built-in CRM', 'Email support', '90-day analytics', '2 TB storage',
      '10 TB bandwidth/month', 'CRM integrations (Zapier, webhooks)',
      { label: 'SMS text-to-lead', yes: false },
    ],
  },
  {
    name: 'Pro', price: 99, color: '#A855F7', current: false,
    tagline: 'Scale your pipeline with advanced tools',
    storage: '1 TB', videos: '150',
    features: [
      '150 videos at 4K', 'Unlimited StreamRoutes', 'All 24 interactive elements',
      'Customizable player + branding', 'Landing pages', '10,000 leads/month',
      'Built-in CRM', 'Priority support', 'Unlimited analytics + heatmaps',
      '2 TB storage', '10 TB bandwidth/month',
      'CRM integrations (Zapier, webhooks)', 'SMS text-to-lead (500/mo)', 'API access',
    ],
  },
  {
    name: 'Enterprise', price: 149, color: '#4F6EF7', current: false,
    tagline: 'Unlimited power for teams and agencies',
    storage: '2 TB', videos: 'Unlimited',
    features: [
      'Unlimited videos at 4K', 'Unlimited StreamRoutes', 'All 24 interactive elements',
      'Customizable player + branding', 'Landing pages', 'Unlimited leads',
      'Built-in CRM', 'Dedicated support + onboarding', 'Unlimited analytics + A/B testing',
      '2 TB storage', '10 TB bandwidth/month',
      'SMS text-to-lead (unlimited)', 'API access', 'White-glove setup',
    ],
  },
]

function PlanTab() {
  return (
    <div style={{ maxWidth: 680 }}>
      {/* Current plan */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Current Plan</div>
      <div style={{ background: 'rgba(6,182,212,0.08)', border: '1.5px solid rgba(6,182,212,0.25)', borderRadius: 14, padding: '16px 18px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', marginBottom: 3 }}>Core Plan</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#06B6D4' }}>$49 / month</div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(6,182,212,0.12)', overflow: 'hidden', margin: '9px 0 5px' }}>
            <div style={{ height: '100%', width: '22%', background: '#06B6D4', borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--t2)' }}>212 of 2,500 leads this month · 18 GB of 500 GB storage · 142 GB of 2 TB bandwidth · Renews Apr 15, 2026</div>
        </div>
        <button style={{ padding: '9px 18px', borderRadius: 10, background: '#06B6D4', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          Upgrade Plan
        </button>
      </div>

      {/* All plans */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>All Plans</div>
      <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{ background: plan.current ? `${plan.color}0D` : 'var(--s2)', border: plan.current ? `2px solid ${plan.color}` : '1px solid var(--b2)', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
            {plan.current && (
              <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700, color: plan.color, background: plan.color + '22', borderRadius: 100, padding: '2px 9px' }}>Current</div>
            )}
            <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--b1)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', marginBottom: 2 }}>{plan.name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10 }}>{plan.tagline}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: plan.color, letterSpacing: -0.5 }}>
                ${plan.price}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t3)' }}>/mo</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{plan.storage} storage · {plan.videos} videos</div>
            </div>
            <div style={{ padding: '12px 16px 16px' }}>
              {plan.features.map((f, i) => {
                const label = typeof f === 'string' ? f : f.label
                const yes   = typeof f === 'string' ? true : f.yes
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: yes ? plan.color + '22' : 'rgba(255,255,255,0.03)', border: `1px solid ${yes ? plan.color + '44' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {yes
                        ? <svg width="9" height="9" viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12" fill="none" stroke={plan.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : <svg width="8" height="8" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" /></svg>
                      }
                    </div>
                    <span style={{ fontSize: 11, color: yes ? 'var(--t1)' : 'var(--t3)' }}>{label}</span>
                  </div>
                )
              })}
              {plan.current ? (
                <div style={{ width: '100%', padding: 9, borderRadius: 10, background: plan.color + '18', border: `1px solid ${plan.color}33`, color: plan.color, fontSize: 12, fontWeight: 700, textAlign: 'center', marginTop: 8 }}>
                  ✓ Your current plan
                </div>
              ) : (
                <button style={{ width: '100%', padding: 9, borderRadius: 10, background: plan.color, color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 8 }}>
                  Upgrade to {plan.name}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════ */
export default function Settings() {
  const { state, set } = useApp()
  const activeTab = state.settingsTab || 'Account'

  return (
    <div style={{ padding: '22px', maxWidth: 680, animation: 'fadeIn 0.18s ease' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--b1)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => set({ settingsTab: t })} style={{
            padding: '10px 20px', background: 'none', border: 'none', fontSize: 13,
            fontWeight: activeTab === t ? 700 : 400,
            color: activeTab === t ? 'var(--t1)' : 'var(--t3)',
            cursor: 'pointer',
            borderBottom: `2px solid ${activeTab === t ? 'var(--acc)' : 'transparent'}`,
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      {activeTab === 'Account'      && <AccountTab />}
      {activeTab === 'Lead Routing' && <LeadRoutingTab />}
      {activeTab === 'Video Import' && <VideoImportTab />}
      {activeTab === 'API Keys'     && <APIKeysTab />}
      {activeTab === 'Plan'         && <PlanTab />}
    </div>
  )
}
