'use client'
import { useState, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { EL_TYPES } from './elTypes'

// ── Constants ──────────────────────────────────────────────────────────────────
const GATEABLE = new Set(['cta-email','cta-booking','cta-download','funnel-urgency','survey-poll','survey-rating','survey-nps'])
const FS_TYPES  = new Set(['cta-email','cta-booking','cta-download','funnel-urgency','survey-poll','survey-rating','survey-nps'])
const CAPTURE   = new Set(['cta-email','cta-booking','cta-download','funnel-urgency'])

// ── Base style ─────────────────────────────────────────────────────────────────
const INP_STYLE = {
  width:'100%', padding:'8px 10px', borderRadius:8, fontSize:12,
  background:'var(--s2)', border:'1px solid var(--b2)', color:'var(--t1)',
  outline:'none', boxSizing:'border-box',
}

// ── Tiny helpers ───────────────────────────────────────────────────────────────
function Row({ label, children, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <div style={{ fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

function Inp({ value='', onChange, placeholder='', type='text', min, max, style }) {
  return (
    <input
      type={type} value={value ?? ''} min={min} max={max}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...INP_STYLE, ...style }}
    />
  )
}

function Txta({ value='', onChange, placeholder='', rows=3 }) {
  return (
    <textarea
      value={value ?? ''} rows={rows}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...INP_STYLE, resize:'vertical', lineHeight:1.5, fontFamily:'inherit' }}
    />
  )
}

function ColorInp({ value, onChange }) {
  const [draft, setDraft] = useState(value || '#4F6EF7')
  const prevValue = useRef(value)

  // Sync when parent value changes (e.g. switching elements)
  if (value !== prevValue.current) {
    prevValue.current = value
    setDraft(value || '#4F6EF7')
  }

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input type="color" value={draft}
        onInput={e => setDraft(e.target.value)}
        onChange={e => onChange(e.target.value)}
        style={{ width:36, height:36, padding:3, borderRadius:8, border:'1px solid var(--b2)', background:'var(--s2)', cursor:'pointer', flexShrink:0 }} />
      <input type="text" value={draft}
        onChange={e => { setDraft(e.target.value); onChange(e.target.value) }}
        style={{ ...INP_STYLE, flex:1, fontFamily:'monospace', fontSize:11 }} />
    </div>
  )
}

function Tog({ checked, onChange, label, desc, alwaysOn }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--b1)' }}>
      <div style={{ flex:1, marginRight:8 }}>
        <div style={{ fontSize:11, fontWeight:500, color:'var(--t1)' }}>{label}</div>
        {desc && <div style={{ fontSize:9, color:'var(--t3)', marginTop:1 }}>{desc}</div>}
      </div>
      {alwaysOn
        ? <span style={{ fontSize:9, color:'var(--grn)', fontWeight:600 }}>Always on</span>
        : <div onClick={() => onChange(!checked)}
            className={`toggle-sw ${checked ? 'on' : ''}`}
            style={{ width:36, height:20, borderRadius:100, cursor:'pointer', position:'relative',
              background:checked?'var(--grn)':'var(--s4)', border:`1px solid ${checked?'var(--grn)':'var(--b2)'}`,
              transition:'background 0.2s,border-color 0.2s', flexShrink:0 }}>
            <div style={{ position:'absolute', top:2, left:checked?18:2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
          </div>
      }
    </div>
  )
}

function SecHead({ label, topSpace }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.5px',
      marginTop:topSpace??14, marginBottom:8 }}>
      {label}
    </div>
  )
}

function MobBanner({ text='Mobile only — hidden on desktop' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(30,216,160,0.06)', border:'1px solid rgba(30,216,160,0.15)', borderRadius:9, padding:'8px 11px', marginBottom:14 }}>
      <span style={{ fontSize:13 }}>📱</span>
      <span style={{ fontSize:10, color:'var(--grn)', fontWeight:600 }}>{text}</span>
    </div>
  )
}

function CaptureFields({ p, upP }) {
  return (
    <>
      <SecHead label="Capture Fields" topSpace={6} />
      <Tog checked alwaysOn label="✉️ Email" />
      <Tog checked={!!p.collectName}  onChange={v => upP({ collectName:  v })} label="👤 Name" />
      <Tog checked={!!p.collectPhone} onChange={v => upP({ collectPhone: v })} label="📞 Phone" desc="optional" />
    </>
  )
}

// ── image-clickable as own component (needs useRef) ────────────────────────────
function ImageClickableProps({ el, onChange }) {
  const p      = el.props || {}
  const upP    = patch => onChange({ ...el, props: { ...p, ...patch } })
  const fRef   = useRef(null)

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => upP({ imageUrl: e.target.result, imageName: file.name })
    reader.readAsDataURL(file)
  }

  return (
    <>
      <Row label="Image">
        {p.imageUrl ? (
          <div style={{ position:'relative', borderRadius:8, overflow:'hidden', border:'1px solid var(--b2)', marginBottom:8 }}>
            <img src={p.imageUrl} alt={p.altText||''} style={{ width:'100%', maxHeight:140, objectFit:'contain', display:'block', background:'var(--s2)' }} />
            <button onClick={() => upP({ imageUrl:'', imageName:'' })}
              style={{ position:'absolute', top:6, right:6, width:22, height:22, borderRadius:6, background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.15)', color:'#FF6B6B', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => fRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--acc)'; e.currentTarget.style.background='rgba(79,110,247,0.08)' }}
            onDragLeave={e => { e.currentTarget.style.borderColor='var(--b2)'; e.currentTarget.style.background='var(--s2)' }}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); e.currentTarget.style.borderColor='var(--b2)'; e.currentTarget.style.background='var(--s2)' }}
            style={{ border:'2px dashed var(--b2)', borderRadius:10, background:'var(--s2)', padding:'20px 12px', textAlign:'center', cursor:'pointer', transition:'border-color 0.2s,background 0.2s', marginBottom:8 }}>
            <div style={{ fontSize:24, marginBottom:6, opacity:0.5 }}>🖼️</div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--t2)', marginBottom:3 }}>Drop image here or click to browse</div>
            <div style={{ fontSize:10, color:'var(--t3)' }}>PNG, JPG, GIF, SVG, WebP</div>
          </div>
        )}
        <input ref={fRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
        {p.imageName && <div style={{ fontSize:10, color:'var(--t2)', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.imageName}</div>}
      </Row>
      <Row label="Link URL"><Inp value={p.url} onChange={v => upP({ url: v })} placeholder="https://example.com" /></Row>
      <Row label="Open In">
        <div style={{ display:'flex', gap:6 }}>
          {[{v:true,l:'New Tab'},{v:false,l:'Same Tab'}].map(o => {
            const active = (p.openNewTab !== false) === o.v
            return (
              <button key={String(o.v)} onClick={() => upP({ openNewTab: o.v })}
                style={{ flex:1, padding:'7px 0', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer',
                  border:'1px solid '+(active?'var(--acc)':'var(--b2)'),
                  background:active?'rgba(79,110,247,0.12)':'var(--s2)',
                  color:active?'var(--acc)':'var(--t2)' }}>
                {o.l}
              </button>
            )
          })}
        </div>
      </Row>
      <Row label="Border Radius (px)"><Inp type="number" value={p.borderRadius ?? 8} onChange={v => upP({ borderRadius: parseInt(v)||0 })} min={0} max={50} /></Row>
      <Row label="Alt Text"><Inp value={p.altText} onChange={v => upP({ altText: v })} placeholder="Describe the image..." /></Row>
    </>
  )
}

// ── PropsTab ───────────────────────────────────────────────────────────────────
function PropsTab({ el, onChange }) {
  const p   = el.props || {}
  const upP = patch => onChange({ ...el, props: { ...p, ...patch } })

  function CaptureContent() {
    return (
      <>
        <Row label="Headline"><Inp value={p.headline} onChange={v => upP({ headline: v })} placeholder="Get the free playbook" /></Row>
        {el.type !== 'cta-download' && (
          <Row label="Subtitle"><Inp value={p.sub} onChange={v => upP({ sub: v })} placeholder="Supporting text..." /></Row>
        )}
        <Row label="Button Text"><Inp value={p.buttonText} onChange={v => upP({ buttonText: v })} placeholder="Send Me the Playbook" /></Row>
        <Row label="Button Color"><ColorInp value={p.buttonColor} onChange={v => upP({ buttonColor: v })} /></Row>
      </>
    )
  }

  switch (el.type) {

    // ── Capture types ───────────────────────────────────────────────────────
    case 'cta-email':
      return <><CaptureFields p={p} upP={upP} /><CaptureContent /></>

    case 'cta-booking':
      return (
        <>
          <Row label="Headline"><Inp value={p.headline} onChange={v => upP({ headline: v })} placeholder="Book a call..." /></Row>
          <Row label="Subtitle"><Inp value={p.sub} onChange={v => upP({ sub: v })} placeholder="Pick a time below" /></Row>
          <Row label="Button Text"><Inp value={p.buttonText} onChange={v => upP({ buttonText: v })} placeholder="Book Now" /></Row>
          <Row label="Calendar URL"><Inp value={p.calUrl} onChange={v => upP({ calUrl: v })} placeholder="Calendly or Cal.com URL" /></Row>
          <CaptureFields p={p} upP={upP} />
        </>
      )

    case 'cta-download':
      return <><CaptureFields p={p} upP={upP} /><CaptureContent /></>

    case 'funnel-urgency':
      return (
        <>
          <Row label="Headline"><Inp value={p.headline} onChange={v => upP({ headline: v })} placeholder="Want to Continue Watching?" /></Row>
          <Row label="Subheadline"><Inp value={p.subheadline} onChange={v => upP({ subheadline: v })} placeholder="Enter Your Details Below" /></Row>
          <Row label="Button Text"><Inp value={p.buttonText} onChange={v => upP({ buttonText: v })} placeholder="Continue Watching →" /></Row>
          <Row label="Urgency Badge">
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>⚡</span>
              <Inp value={p.urgencyText} onChange={v => upP({ urgencyText: v })} placeholder="Only 3 spots left..." style={{ flex:1 }} />
            </div>
          </Row>
          <Row label="Button Color"><ColorInp value={p.buttonColor} onChange={v => upP({ buttonColor: v })} /></Row>
          <CaptureFields p={p} upP={upP} />
        </>
      )

    // ── Overlay types ───────────────────────────────────────────────────────
    case 'cta-button':
      return (
        <>
          <Row label="Button Text"><Inp value={p.text} onChange={v => upP({ text: v })} placeholder="Learn More →" /></Row>
          <Row label="URL"><Inp value={p.url} onChange={v => upP({ url: v })} placeholder="https://" /></Row>
          <Row label="Button Color"><ColorInp value={p.buttonColor} onChange={v => upP({ buttonColor: v })} /></Row>
        </>
      )

    case 'overlay-text': {
      const align = p.align || 'center'
      return (
        <>
          <Row label="Text"><Txta value={p.text} onChange={v => upP({ text: v })} placeholder="Your compelling headline here" /></Row>
          <Row label="Font Size"><Inp type="number" value={p.fontSize||20} onChange={v => upP({ fontSize: parseInt(v)||20 })} min={8} max={96} /></Row>
          <Row label="Text Color"><ColorInp value={p.color} onChange={v => upP({ color: v })} /></Row>
          <Row label="Background"><Inp value={p.background} onChange={v => upP({ background: v })} placeholder="rgba(0,0,0,0.5)" /></Row>
          <Row label="Align">
            <div style={{ display:'flex', gap:6 }}>
              {[{v:'center',l:'⬛ Centre'},{v:'left',l:'⬅ Left'}].map(o => {
                const active = align === o.v
                return (
                  <button key={o.v} onClick={() => upP({ align: o.v })}
                    style={{ flex:1, padding:'7px 0', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer',
                      border:'1px solid '+(active?'var(--acc)':'var(--b2)'),
                      background:active?'rgba(79,110,247,0.12)':'var(--s2)',
                      color:active?'var(--acc)':'var(--t2)' }}>
                    {o.l}
                  </button>
                )
              })}
            </div>
          </Row>
        </>
      )
    }

    case 'overlay-countdown':
      return (
        <>
          <Row label="Label"><Inp value={p.label} onChange={v => upP({ label: v })} placeholder="Offer ends in" /></Row>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            <Row label="Minutes"><Inp type="number" value={p.minutes??10} onChange={v => upP({ minutes: parseInt(v)||0 })} min={0} /></Row>
            <Row label="Seconds"><Inp type="number" value={p.seconds??0}  onChange={v => upP({ seconds: Math.min(59,parseInt(v)||0) })} min={0} max={59} /></Row>
          </div>
          <Row label="Color"><ColorInp value={p.color} onChange={v => upP({ color: v })} /></Row>
        </>
      )

    case 'overlay-chapter':
      return (
        <>
          <Row label="Chapter"><Inp value={p.chapter} onChange={v => upP({ chapter: v })} placeholder="Chapter 1" /></Row>
          <Row label="Title"><Inp value={p.title} onChange={v => upP({ title: v })} placeholder="Introduction" /></Row>
          <Row label="Color"><ColorInp value={p.color} onChange={v => upP({ color: v })} /></Row>
        </>
      )

    case 'share-social':
      return (
        <>
          <Row label="Label"><Inp value={p.label} onChange={v => upP({ label: v })} placeholder="Share this video" /></Row>
          <Row label="Color"><ColorInp value={p.color} onChange={v => upP({ color: v })} /></Row>
          <Row label="Layout">
            <div style={{ display:'flex', gap:6 }}>
              {['horizontal','vertical'].map(l => {
                const active = (p.layout||'horizontal') === l
                return (
                  <button key={l} onClick={() => upP({ layout: l })}
                    style={{ flex:1, padding:'7px 0', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer',
                      border:'1px solid '+(active?'var(--acc)':'var(--b2)'),
                      background:active?'rgba(79,110,247,0.12)':'var(--s2)',
                      color:active?'var(--acc)':'var(--t2)' }}>
                    {l.charAt(0).toUpperCase()+l.slice(1)}
                  </button>
                )
              })}
            </div>
          </Row>
        </>
      )

    case 'sticky-bar': {
      const pos = p.position || 'bottom'
      return (
        <>
          <Row label="Bar Text"><Inp value={p.text} onChange={v => upP({ text: v })} placeholder="Your CTA message..." /></Row>
          <Row label="Button Text"><Inp value={p.buttonText} onChange={v => upP({ buttonText: v })} placeholder="Book Now →" /></Row>
          <Row label="Button Color"><ColorInp value={p.buttonColor} onChange={v => upP({ buttonColor: v })} /></Row>
          <Row label="Link URL"><Inp value={p.url} onChange={v => upP({ url: v })} placeholder="https://..." /></Row>
          <Row label="Position">
            <div style={{ display:'flex', gap:6 }}>
              {[{v:'top',l:'↑ Top'},{v:'bottom',l:'↓ Bottom'}].map(o => {
                const active = pos === o.v
                return (
                  <button key={o.v} onClick={() => upP({ position: o.v })}
                    style={{ flex:1, padding:'7px 10px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer',
                      border:'1px solid '+(active?'var(--acc)':'var(--b2)'),
                      background:active?'rgba(79,110,247,0.12)':'var(--s2)',
                      color:active?'var(--acc)':'var(--t2)' }}>
                    {o.l}
                  </button>
                )
              })}
            </div>
          </Row>
        </>
      )
    }

    case 'annotation-link':
      return (
        <>
          <Row label="Title"><Inp value={p.title} onChange={v => upP({ title: v })} placeholder="Watch Next" /></Row>
          <Row label="Subtitle"><Inp value={p.sub} onChange={v => upP({ sub: v })} placeholder="Description..." /></Row>
          <Row label="Link URL"><Inp value={p.url} onChange={v => upP({ url: v })} placeholder="https://..." /></Row>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Emoji Icon</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="text" value={p.thumbnailEmoji||'🎬'}
                onInput={e => upP({ thumbnailEmoji: e.target.value })}
                onFocus={e => e.target.select()}
                style={{ width:44, height:44, borderRadius:10, background:'var(--s2)', border:'1px solid var(--b2)', textAlign:'center', fontSize:22, padding:0, outline:'none', cursor:'pointer', color:'var(--t1)' }} />
              <span style={{ fontSize:10, color:'var(--t3)', lineHeight:1.4 }}>Click to select, then type or paste any emoji</span>
            </div>
          </div>
          <Row label="Color"><ColorInp value={p.color} onChange={v => upP({ color: v })} /></Row>
        </>
      )

    case 'image-clickable':
      return <ImageClickableProps el={el} onChange={onChange} />

    // ── Survey types ────────────────────────────────────────────────────────
    case 'survey-poll': {
      const opts  = p.options || ['More leads','Better conversions','Build my brand','Save time']
      const color = p.buttonColor || '#A855F7'
      const fakePcts = [42, 28, 18, 12, 0, 0]
      return (
        <>
          <Row label="Question"><Inp value={p.question} onChange={v => upP({ question: v })} placeholder="What matters most to you?" /></Row>
          <SecHead label="Options" />
          {opts.map((opt, i) => (
            <div key={i} style={{ display:'flex', gap:5, marginBottom:6, alignItems:'center' }}>
              <span style={{ fontSize:10, color:'var(--t3)', minWidth:16 }}>{i+1}.</span>
              <input value={opt}
                onChange={e => { const next = [...opts]; next[i] = e.target.value; upP({ options: next }) }}
                style={{ ...INP_STYLE, flex:1, margin:0, fontSize:11 }} />
              {opts.length > 2 && (
                <button onClick={() => upP({ options: opts.filter((_,j) => j!==i) })}
                  style={{ width:22, height:22, borderRadius:5, background:'none', border:'1px solid var(--b2)', color:'var(--red)', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
              )}
            </div>
          ))}
          {opts.length < 6 && (
            <button onClick={() => upP({ options: [...opts, `Option ${opts.length+1}`] })}
              style={{ width:'100%', padding:6, borderRadius:7, background:'var(--s2)', border:'1px solid var(--b2)', color:'var(--t2)', fontSize:10, cursor:'pointer', marginBottom:10 }}>+ Add Option</button>
          )}
          <Row label="Button Text"><Inp value={p.buttonText} onChange={v => upP({ buttonText: v })} placeholder="Submit Answer" /></Row>
          <Row label="Button Color"><ColorInp value={p.buttonColor} onChange={v => upP({ buttonColor: v })} /></Row>
          <Tog checked={!!p.showResults} onChange={v => upP({ showResults: v })} label="Show results after voting" />
          <Tog checked={!!p.requireEmail} onChange={v => upP({ requireEmail: v })} label="✉️ Require email to vote" desc="Captures lead + poll answer" />
          <CaptureFields p={p} upP={upP} />

          {/* Results Preview */}
          <SecHead label="Results Preview" />
          <div style={{ background:'var(--s3)', border:'1px solid var(--b2)', borderRadius:10, padding:12, marginBottom:6 }}>
            <div style={{ fontSize:9, color:'var(--t3)', marginBottom:8 }}>Aggregated results appear in Analytics → Elements</div>
            {opts.map((opt, i) => (
              <div key={i} style={{ marginBottom:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:10, color:'var(--t1)', fontWeight:500 }}>{opt}</span>
                  <span style={{ fontSize:10, color:'var(--t2)', fontWeight:700 }}>{fakePcts[i]||0}%</span>
                </div>
                <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)' }}>
                  <div style={{ height:'100%', width:Math.max(2, fakePcts[i]||0)+'%', borderRadius:2, background:color }} />
                </div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, paddingTop:6, borderTop:'1px solid var(--b1)' }}>
              <span style={{ fontSize:9, color:'var(--t3)' }}>Total responses</span>
              <span style={{ fontSize:9, fontWeight:700, color:'var(--t2)' }}>847</span>
            </div>
          </div>
        </>
      )
    }

    case 'survey-rating':
      return (
        <>
          <Row label="Question"><Inp value={p.question} onChange={v => upP({ question: v })} placeholder="How valuable was this?" /></Row>
          <Row label="Stars (max)"><Inp type="number" value={p.stars||5} onChange={v => upP({ stars: Math.max(1, Math.min(10, parseInt(v)||5)) })} min={1} max={10} /></Row>
          <CaptureFields p={p} upP={upP} />
          <Row label="Button Text"><Inp value={p.buttonText}  onChange={v => upP({ buttonText:  v })} placeholder="Submit Rating" /></Row>
          <Row label="Button Color"><ColorInp value={p.buttonColor} onChange={v => upP({ buttonColor: v })} /></Row>
        </>
      )

    case 'survey-nps':
      return (
        <>
          <Row label="Question"><Inp value={p.question}  onChange={v => upP({ question:  v })} placeholder="How likely are you to recommend us?" /></Row>
          <Row label="Low Label"><Inp value={p.lowLabel} onChange={v => upP({ lowLabel:  v })} placeholder="Not likely" /></Row>
          <Row label="High Label"><Inp value={p.highLabel}onChange={v => upP({ highLabel: v })} placeholder="Very likely" /></Row>
          <CaptureFields p={p} upP={upP} />
          <Row label="Button Text"><Inp value={p.buttonText}  onChange={v => upP({ buttonText:  v })} placeholder="Submit" /></Row>
          <Row label="Button Color"><ColorInp value={p.buttonColor} onChange={v => upP({ buttonColor: v })} /></Row>
        </>
      )

    // ── Mobile types ────────────────────────────────────────────────────────
    case 'mob-call':
      return (
        <>
          <MobBanner />
          <Row label="Phone Number"><Inp value={p.phone}    onChange={v => upP({ phone:    v })} placeholder="+1 (555) 123-4567" /></Row>
          <Row label="Button Label"><Inp value={p.label}    onChange={v => upP({ label:    v })} placeholder="Call Now" /></Row>
          <Row label="Subtitle">    <Inp value={p.subtitle} onChange={v => upP({ subtitle: v })} placeholder="Tap to connect instantly" /></Row>
          <Row label="Button Color"><ColorInp value={p.bgColor} onChange={v => upP({ bgColor: v })} /></Row>
        </>
      )

    case 'mob-sms':
      return (
        <>
          <MobBanner />
          <Row label="Phone Number"><Inp value={p.phone} onChange={v => upP({ phone: v })} placeholder="+1 (555) 123-4567" /></Row>
          <Row label="Pre-filled Message"><Txta value={p.message} onChange={v => upP({ message: v })} placeholder="Hi! I watched your video..." rows={3} /></Row>
          <Row label="Button Label"><Inp value={p.label} onChange={v => upP({ label: v })} placeholder="Text Us" /></Row>
          <Row label="Button Color"><ColorInp value={p.bgColor} onChange={v => upP({ bgColor: v })} /></Row>
        </>
      )

    case 'mob-vcard':
      return (
        <>
          <MobBanner />
          <Row label="Full Name"><Inp value={p.name}    onChange={v => upP({ name:    v })} placeholder="Justin Smith" /></Row>
          <Row label="Phone">    <Inp value={p.phone}   onChange={v => upP({ phone:   v })} placeholder="+1 (555) 123-4567" /></Row>
          <Row label="Email">    <Inp value={p.email}   onChange={v => upP({ email:   v })} placeholder="you@company.com" /></Row>
          <Row label="Company">  <Inp value={p.company} onChange={v => upP({ company: v })} placeholder="Your Company" /></Row>
          <Row label="Job Title"><Inp value={p.title}   onChange={v => upP({ title:   v })} placeholder="Real Estate Agent" /></Row>
          <Row label="Button Label"><Inp value={p.label} onChange={v => upP({ label: v })} placeholder="Save My Contact" /></Row>
          <Row label="Button Color"><ColorInp value={p.bgColor} onChange={v => upP({ bgColor: v })} /></Row>
        </>
      )

    case 'mob-calendar':
      return (
        <>
          <MobBanner />
          <Row label="Event Title">   <Inp value={p.eventTitle}    onChange={v => upP({ eventTitle:    v })} placeholder="Open House — 123 Main St" /></Row>
          <Row label="Date">          <Inp value={p.eventDate}     onChange={v => upP({ eventDate:     v })} placeholder="2026-04-15" /></Row>
          <Row label="Time">          <Inp value={p.eventTime}     onChange={v => upP({ eventTime:     v })} placeholder="2:00 PM" /></Row>
          <Row label="Location">      <Inp value={p.eventLocation} onChange={v => upP({ eventLocation: v })} placeholder="123 Main St, Santa Monica" /></Row>
          <Row label="Duration (min)"><Inp type="number" value={p.eventDuration||60} onChange={v => upP({ eventDuration: parseInt(v)||60 })} min={5} /></Row>
          <Row label="Button Label">  <Inp value={p.label}   onChange={v => upP({ label:   v })} placeholder="Add to Calendar" /></Row>
          <Row label="Button Color">  <ColorInp value={p.bgColor} onChange={v => upP({ bgColor: v })} /></Row>
        </>
      )

    case 'mob-swipe':
      return (
        <>
          <MobBanner />
          <Row label="CTA Text"><Inp value={p.label} onChange={v => upP({ label: v })} placeholder="Swipe Up to Learn More" /></Row>
          <Row label="Link URL"><Inp value={p.url}   onChange={v => upP({ url:   v })} placeholder="https://..." /></Row>
          <Row label="Color">  <ColorInp value={p.bgColor} onChange={v => upP({ bgColor: v })} /></Row>
        </>
      )

    case 'mob-share':
      return (
        <>
          <MobBanner />
          <Row label="Share Message"><Inp value={p.message} onChange={v => upP({ message: v })} placeholder="Check out this video:" /></Row>
          <Row label="Button Label"> <Inp value={p.label}   onChange={v => upP({ label:   v })} placeholder="Share with a Friend" /></Row>
          <Row label="Button Color"> <ColorInp value={p.bgColor} onChange={v => upP({ bgColor: v })} /></Row>
        </>
      )

    case 'mob-directions':
      return (
        <>
          <MobBanner />
          <Row label="Address">      <Inp value={p.address}  onChange={v => upP({ address:  v })} placeholder="123 Main St, Santa Monica, CA" /></Row>
          <Row label="Button Label"> <Inp value={p.label}    onChange={v => upP({ label:    v })} placeholder="Get Directions" /></Row>
          <Row label="Subtitle">     <Inp value={p.subtitle} onChange={v => upP({ subtitle: v })} placeholder="Open in Maps" /></Row>
          <Row label="Button Color"> <ColorInp value={p.bgColor} onChange={v => upP({ bgColor: v })} /></Row>
        </>
      )

    case 'mob-screenshot':
      return (
        <>
          <MobBanner text="Mobile only — prompts viewer to screenshot" />
          <Row label="Headline">    <Inp value={p.headline}   onChange={v => upP({ headline:    v })} placeholder="Save This Info" /></Row>
          <Row label="Line 1">      <Inp value={p.line1}      onChange={v => upP({ line1:       v })} placeholder="123 Main St, Santa Monica" /></Row>
          <Row label="Line 2">      <Inp value={p.line2}      onChange={v => upP({ line2:       v })} placeholder="3 bed · 2 bath · 1,850 sq ft" /></Row>
          <Row label="Phone">       <Inp value={p.phone}      onChange={v => upP({ phone:       v })} placeholder="(310) 555-1234" /></Row>
          <Row label="Card Color">  <ColorInp value={p.bgColor}     onChange={v => upP({ bgColor:     v })} /></Row>
          <Row label="Accent Color"><ColorInp value={p.accentColor} onChange={v => upP({ accentColor: v })} /></Row>
        </>
      )

    case 'mob-shake':
      return (
        <>
          <MobBanner text="Mobile only — uses device motion API" />
          <Row label="Prompt Text">   <Inp value={p.promptText}  onChange={v => upP({ promptText:  v })} placeholder="Shake your phone for a surprise!" /></Row>
          <Row label="Hidden Reveal"> <Inp value={p.hiddenText}  onChange={v => upP({ hiddenText:  v })} placeholder="Use code SAVE20 for 20% off!" /></Row>
          <Row label="Prompt Color">  <ColorInp value={p.bgColor}   onChange={v => upP({ bgColor:   v })} /></Row>
          <Row label="Reveal Color">  <ColorInp value={p.revealBg}  onChange={v => upP({ revealBg:  v })} /></Row>
        </>
      )

    default:
      return (
        <div style={{ padding:20, textAlign:'center', color:'var(--t3)', fontSize:11 }}>
          No properties available for this element type.
        </div>
      )
  }
}

// ── Accordion card (used in GateTab) ──────────────────────────────────────────
function AccordionCard({ open, onToggle, icon, title, summary, children }) {
  return (
    <div style={{ background:'var(--s3)', border:'1px solid var(--b2)', borderRadius:10, marginBottom:8, overflow:'hidden' }}>
      <div onClick={onToggle}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 11px', cursor:'pointer', userSelect:'none' }}>
        <span style={{ fontSize:13 }}>{icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--t1)' }}>{title}</div>
          <div style={{ fontSize:9, color:'var(--t3)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{summary}</div>
        </div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round">
          {open ? <polyline points="6,9 12,15 18,9" /> : <polyline points="9,18 15,12 9,6" />}
        </svg>
      </div>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{ padding:'4px 11px 10px', borderTop:'1px solid var(--b1)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Connect Settings Link ─────────────────────────────────────────────────────
function ConnectSettingsLink() {
  const { set } = useApp()
  const handleClick = () => {
    set({ page: 'settings', settingsTab: 'Integrations', libSelectedVideo: null })
  }
  return (
    <span onClick={handleClick} style={{ color:'var(--acc)', cursor:'pointer', fontWeight:600 }}>Connect in Settings →</span>
  )
}

// ── GateTab ────────────────────────────────────────────────────────────────────
function GateTab({ el, onChange }) {
  const [cards, setCards]   = useState({ content:true, magnet:false, routing:false, post:false })
  const [lmCustom, setLmC]  = useState(false)
  const lmFileRef            = useRef(null)

  const def  = EL_TYPES[el.type] || {}
  const gate = el.gate || {}
  const isOn = !!gate.enabled

  const upG  = patch => onChange({ ...el, gate: { ...gate, ...patch } })
  const upLM = patch => upG({ leadMagnet: { ...(gate.leadMagnet||{}), ...patch } })
  const tog  = k => setCards(s => ({ ...s, [k]: !s[k] }))

  function handleLmFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => upLM({ fileUrl: e.target.result, fileName: file.name })
    reader.readAsDataURL(file)
  }

  function GateSettings() {
    if (el.type === 'cta-email' || el.type === 'survey-poll' || el.type === 'survey-rating' || el.type === 'survey-nps') {
      return (
        <>
          <Tog checked={!!gate.allowSkip} onChange={v => upG({ allowSkip: v })} label="Allow Skip" desc="Let viewers skip the gate" />
          {gate.allowSkip && <Row label="Skip delay (sec)" style={{ marginTop:8 }}><Inp type="number" value={gate.skipDelay??0} onChange={v => upG({ skipDelay: parseFloat(v)||0 })} min={0} /></Row>}
          <Row label="Success Message" style={{ marginTop:8 }}><Inp value={gate.successMessage} onChange={v => upG({ successMessage: v })} placeholder="Continuing your video…" /></Row>
        </>
      )
    }
    if (el.type === 'cta-booking') {
      return (
        <>
          <Row label="Calendar URL" style={{ marginTop:4 }}><Inp value={gate.calendarUrl} onChange={v => upG({ calendarUrl: v })} placeholder="https://calendly.com/..." /></Row>
          <Tog checked={!!gate.allowSkip} onChange={v => upG({ allowSkip: v })} label="Allow Skip" desc="Let viewers skip" />
          {gate.allowSkip && <Row label="Skip text" style={{ marginTop:8 }}><Inp value={gate.skipText} onChange={v => upG({ skipText: v })} placeholder="Skip" /></Row>}
        </>
      )
    }
    if (el.type === 'cta-download') {
      return (
        <>
          <Tog checked={!!gate.collectEmailForDownload} onChange={v => upG({ collectEmailForDownload: v })} label="Require Email" desc="Collect email before download" />
          <Tog checked={!!gate.allowSkip}               onChange={v => upG({ allowSkip: v })}               label="Allow Skip" />
          {gate.allowSkip && <Row label="Skip delay (sec)" style={{ marginTop:8 }}><Inp type="number" value={gate.skipDelay??0} onChange={v => upG({ skipDelay: parseFloat(v)||0 })} min={0} /></Row>}
        </>
      )
    }
    if (el.type === 'funnel-urgency') {
      return (
        <>
          <Tog checked={!!gate.showCountdown} onChange={v => upG({ showCountdown: v })} label="Countdown Timer" desc="Visible countdown" />
          {gate.showCountdown && <Row label="Minutes" style={{ marginTop:8 }}><Inp type="number" value={gate.countdownMins??15} onChange={v => upG({ countdownMins: parseInt(v)||15 })} min={1} /></Row>}
          <Tog checked={!!gate.allowSkip} onChange={v => upG({ allowSkip: v })} label="Allow Skip" />
          {gate.allowSkip && <Row label="Skip text" style={{ marginTop:8 }}><Inp value={gate.skipText} onChange={v => upG({ skipText: v })} placeholder="No thanks" /></Row>}
          <Row label="Success Message" style={{ marginTop:8 }}><Inp value={gate.successMessage} onChange={v => upG({ successMessage: v })} placeholder="You're in! Continuing…" /></Row>
        </>
      )
    }
    return <div style={{ fontSize:10, color:'var(--t3)', textAlign:'center', padding:'8px 0' }}>No gate settings for overlay elements</div>
  }

  const lm      = gate.leadMagnet || {}
  const lmOn    = !!lm.enabled
  const postAct = gate.postAction || 'continue'

  const POST_OPTS = [
    { v:'continue', l:'▶ Continue Video',  d:'Resumes playing' },
    { v:'redirect', l:'🔗 Redirect',        d:'Send to another page' },
    { v:'message',  l:'💬 Show Message',    d:'Custom thank-you' },
  ]

  const contentSum = (gate.allowSkip ? 'Skippable' : 'Required') + (gate.validateEmail ? ' · Email validation' : '')
  const magSum     = lmOn ? (lm.fileUrl ? lm.fileName||'File ready' : 'No file yet') : 'Off'
  const postSum    = { continue:'Continue video', redirect:'Redirect'+(gate.followUpUrl?' →':''), message:'Thank-you message' }[postAct] || ''

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, paddingBottom:10, borderBottom:'1px solid var(--b1)' }}>
        <span style={{ fontSize:16 }}>{def.icon}</span>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--t1)' }}>{def.label}</div>
        </div>
      </div>

      {/* Master toggle */}
      <div style={{ background:isOn?'rgba(30,216,160,0.05)':'var(--s3)', border:'1.5px solid '+(isOn?'rgba(30,216,160,0.2)':'var(--b2)'), borderRadius:12, padding:'12px 14px', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--t1)', display:'flex', alignItems:'center', gap:7 }}>
              🔒 Gate
              <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:100,
                background:isOn?'rgba(30,216,160,0.12)':'var(--s4)',
                color:isOn?'var(--grn)':'var(--t3)' }}>
                {isOn ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <div style={{ fontSize:9, color:'var(--t3)', marginTop:2 }}>Pauses video until action taken</div>
          </div>
          <div onClick={() => upG({ enabled: !gate.enabled })}
            className={`toggle-sw ${isOn ? 'on' : ''}`}
            style={{ width:36, height:20, borderRadius:100, cursor:'pointer', position:'relative',
              background:isOn?'var(--grn)':'var(--s4)', border:`1px solid ${isOn?'var(--grn)':'var(--b2)'}`,
              transition:'background 0.2s,border-color 0.2s', flexShrink:0 }}>
            <div style={{ position:'absolute', top:2, left:isOn?18:2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
          </div>
        </div>
      </div>

      {isOn && (
        <>
          <AccordionCard open={cards.content} onToggle={() => tog('content')} icon="⚙️" title="Gate Settings" summary={contentSum}>
            <GateSettings />
          </AccordionCard>

          {CAPTURE.has(el.type) && (
            <AccordionCard open={cards.magnet} onToggle={() => tog('magnet')} icon="📎" title="Lead Magnet" summary={magSum}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--t1)' }}>Deliver a File</div>
                  <div style={{ fontSize:9, color:'var(--t3)', marginTop:1 }}>Email a file instantly on submit</div>
                </div>
                <div onClick={() => upLM({ enabled: !lmOn })}
                  className={`toggle-sw ${lmOn ? 'on' : ''}`}
                  style={{ width:36, height:20, borderRadius:100, cursor:'pointer', position:'relative',
                    background:lmOn?'var(--grn)':'var(--s4)', border:`1px solid ${lmOn?'var(--grn)':'var(--b2)'}`,
                    transition:'background 0.2s,border-color 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:2, left:lmOn?18:2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
                </div>
              </div>
              {lmOn && (
                <>
                  {lm.fileUrl ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, background:'rgba(30,216,160,0.06)', border:'1px solid rgba(30,216,160,0.2)', marginBottom:6 }}>
                      <div style={{ width:32, height:32, borderRadius:7, background:'rgba(30,216,160,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>📄</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lm.fileName||'File'}</div>
                        <div style={{ fontSize:9, color:'var(--grn)', fontWeight:600 }}>✓ Ready</div>
                      </div>
                      <button onClick={() => upLM({ fileUrl:'', fileName:'' })}
                        style={{ flexShrink:0, width:22, height:22, borderRadius:5, background:'none', border:'1px solid var(--b2)', color:'var(--red)', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => lmFileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--acc)' }}
                        onDragLeave={e => e.currentTarget.style.borderColor='var(--b2)'}
                        onDrop={e => { e.preventDefault(); handleLmFile(e.dataTransfer.files[0]); e.currentTarget.style.borderColor='var(--b2)' }}
                        style={{ border:'2px dashed var(--b2)', borderRadius:8, background:'var(--s2)', padding:12, textAlign:'center', cursor:'pointer', marginBottom:6 }}>
                        <div style={{ fontSize:18, marginBottom:3, opacity:0.5 }}>📎</div>
                        <div style={{ fontSize:10, fontWeight:600, color:'var(--t2)' }}>Drop file or click to browse</div>
                      </div>
                      <input ref={lmFileRef} type="file" style={{ display:'none' }} onChange={e => handleLmFile(e.target.files[0])} />
                      <Inp value={lm.fileUrl||''} onChange={v => upLM({ fileUrl: v, fileName:'Linked file' })} placeholder="Or paste file URL..." />
                    </>
                  )}
                  <div style={{ fontSize:9, color:'var(--t3)', lineHeight:1.4, marginTop:6 }}>
                    ✉️ Branded email sent automatically.{' '}
                    <span onClick={() => setLmC(v => !v)} style={{ color:'var(--acc)', cursor:'pointer', fontWeight:600 }}>Customize →</span>
                  </div>
                  {lmCustom && (
                    <>
                      <Row label="Subject"      style={{ marginTop:8 }}><Inp value={lm.subject}  onChange={v => upLM({ subject:  v })} placeholder="Your download is ready!" /></Row>
                      <Row label="Display Name">                         <Inp value={lm.fileName} onChange={v => upLM({ fileName: v })} placeholder="Free Buyer Guide.pdf" /></Row>
                      <Row label="Message">                              <Inp value={lm.message}  onChange={v => upLM({ message:  v })} placeholder="Here's the guide I promised..." /></Row>
                    </>
                  )}
                </>
              )}
            </AccordionCard>
          )}

          <AccordionCard open={cards.routing} onToggle={() => tog('routing')} icon="⚡" title="Lead Routing" summary="CRM always · connect integrations for more">
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:8, background:'rgba(79,110,247,0.06)', border:'1px solid rgba(79,110,247,0.12)', marginBottom:8 }}>
              <span style={{ fontSize:11 }}>👥</span>
              <span style={{ flex:1, fontSize:11, fontWeight:600, color:'var(--t1)' }}>StreamAgent CRM</span>
              <span style={{ fontSize:9, fontWeight:700, color:'var(--grn)' }}>✓ Always</span>
            </div>
            <div style={{ padding:8, borderRadius:7, border:'1px dashed var(--b2)', fontSize:10, color:'var(--t3)', textAlign:'center' }}>
              No integrations connected.{' '}
              <ConnectSettingsLink />
            </div>
          </AccordionCard>

          <AccordionCard open={cards.post} onToggle={() => tog('post')} icon="🎯" title="After Submission" summary={postSum}>
            {POST_OPTS.map(opt => {
              const active = postAct === opt.v
              return (
                <div key={opt.v} onClick={() => upG({ postAction: opt.v })}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 9px', borderRadius:7, marginBottom:3, cursor:'pointer',
                    border:'1px solid '+(active?'var(--acc)':'var(--b2)'),
                    background:active?'rgba(79,110,247,0.06)':'var(--s2)' }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', border:'2px solid '+(active?'var(--acc)':'var(--b2)'), background:active?'var(--acc)':'transparent', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:10, fontWeight:active?700:500, color:active?'var(--acc)':'var(--t1)' }}>{opt.l}</div>
                    <div style={{ fontSize:8, color:'var(--t3)' }}>{opt.d}</div>
                  </div>
                </div>
              )
            })}
            {postAct === 'redirect' && (
              <>
                <Row label="Redirect URL" style={{ marginTop:8 }}><Inp value={gate.followUpUrl} onChange={v => upG({ followUpUrl: v })} placeholder="https://calendly.com/you" /></Row>
                <Tog checked={!!gate.smartFollowUp} onChange={v => upG({ smartFollowUp: v })} label="Append viewer info" desc="Pre-fill name & email on page" />
              </>
            )}
            {postAct === 'message' && (
              <>
                <Row label="Message" style={{ marginTop:8 }}><Inp value={gate.thankYouMessage} onChange={v => upG({ thankYouMessage: v })} placeholder="Thanks! Check your email." /></Row>
                <Row label="Auto-dismiss (sec)"><Inp type="number" value={gate.thankYouDuration??3} onChange={v => upG({ thankYouDuration: parseInt(v)||3 })} min={1} /></Row>
              </>
            )}
          </AccordionCard>
        </>
      )}
    </div>
  )
}

// ── TimingTab ──────────────────────────────────────────────────────────────────
function TimingTab({ el, onChange }) {
  const timing = el.timing || {}
  const upT    = patch => onChange({ ...el, timing: { ...timing, ...patch } })
  const isGate = FS_TYPES.has(el.type)

  // Emoji-prefixed animation options matching HTML reference
  const ANIM_IN  = [
    { v:'fadeIn',     l:'✨ Fade In' },
    { v:'slideUp',    l:'⬆ Slide Up' },
    { v:'slideDown',  l:'⬇ Slide Down' },
    { v:'slideLeft',  l:'⬅ Slide Left' },
    { v:'slideRight', l:'➡ Slide Right' },
    { v:'scaleIn',    l:'🔍 Scale In' },
    { v:'popIn',      l:'💥 Pop In' },
    { v:'none',       l:'— None' },
  ]
  const ANIM_OUT = [
    { v:'fadeOut',    l:'✨ Fade Out' },
    { v:'slideUp',   l:'⬆ Slide Up' },
    { v:'slideDown', l:'⬇ Slide Down' },
    { v:'slideLeft', l:'⬅ Slide Left' },
    { v:'slideRight',l:'➡ Slide Right' },
    { v:'scaleOut',  l:'🔍 Scale Out' },
    { v:'none',      l:'— None' },
  ]
  const SPEEDS   = ['0.2','0.4','0.6','1.0']
  const TRIGGERS = [
    { v:'time',    l:'⏱ At timestamp (default)' },
    { v:'percent', l:'📊 At watch percentage' },
    { v:'rewind',  l:'⏪ After rewind count' },
    { v:'pause',   l:'⏸ After pause count' },
    { v:'exit',    l:'🚪 On exit intent' },
    { v:'idle',    l:'💤 After idle time' },
  ]

  const trig  = timing.trigger  || 'time'
  const animI = timing.animIn   || 'fadeIn'
  const animO = timing.animOut  || 'fadeOut'
  const speed = String(timing.animSpeed || '0.4')
  const dur   = timing.duration || 5

  return (
    <div>
      {/* Timing inputs */}
      <SecHead label="⏱ Timing" topSpace={0} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:14 }}>
        <Row label="Show at (s)">
          <input type="number" min={0} value={timing.in ?? 0}
            onChange={e => upT({ in: parseFloat(e.target.value)||0 })}
            style={{ ...INP_STYLE, fontFamily:'monospace' }} />
        </Row>
        <Row label="Duration (s)">
          <input type="number" min={1} value={dur}
            onChange={e => upT({ duration: parseFloat(e.target.value)||5 })}
            style={{ ...INP_STYLE, fontFamily:'monospace' }} />
        </Row>
      </div>

      {/* Transitions */}
      <SecHead label="⚡ Transitions" />
      {isGate ? (
        <div style={{ background:'var(--s2)', border:'1px solid var(--b2)', borderRadius:9, padding:'10px 12px', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:14 }}>🔒</span>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--t1)' }}>Hard Gate Element</span>
          </div>
          <div style={{ fontSize:10, color:'var(--t3)', lineHeight:1.5 }}>
            This element <strong style={{ color:'var(--t2)' }}>pauses the video instantly</strong> when triggered and takes over the full screen. No enter/exit animations — the gate appears immediately and the video resumes only after the viewer completes the action.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:14 }}>
            <Row label="Enter Animation">
              <select value={animI} onChange={e => upT({ animIn: e.target.value })}
                style={{ ...INP_STYLE, cursor:'pointer' }}>
                {ANIM_IN.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}
              </select>
            </Row>
            <Row label="Exit Animation">
              <select value={animO} onChange={e => upT({ animOut: e.target.value })}
                style={{ ...INP_STYLE, cursor:'pointer' }}>
                {ANIM_OUT.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}
              </select>
            </Row>
          </div>
          <Row label="Transition Speed">
            <div style={{ display:'flex', gap:6 }}>
              {SPEEDS.map(s => {
                const active = speed === s
                return (
                  <button key={s} onClick={() => upT({ animSpeed: s })}
                    style={{ flex:1, padding:'6px 0', borderRadius:7, fontSize:10, fontWeight:600, cursor:'pointer',
                      border:'1px solid '+(active?'var(--acc)':'var(--b2)'),
                      background:active?'rgba(79,110,247,0.12)':'var(--s2)',
                      color:active?'var(--acc)':'var(--t2)' }}>
                    {s}s
                  </button>
                )
              })}
            </div>
          </Row>
          {/* Preview bar */}
          <div style={{ background:'var(--s2)', border:'1px solid var(--b2)', borderRadius:9, padding:'10px 12px', marginBottom:14 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Preview</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:9, color:'var(--t2)' }}>Enter: <span style={{ color:'var(--acc)', fontWeight:600 }}>{animI}</span></span>
              <span style={{ fontSize:9, color:'var(--t3)' }}>→</span>
              <span style={{ fontSize:9, color:'var(--t2)' }}>Visible {dur}s</span>
              <span style={{ fontSize:9, color:'var(--t3)' }}>→</span>
              <span style={{ fontSize:9, color:'var(--t2)' }}>Exit: <span style={{ color:'var(--acc)', fontWeight:600 }}>{animO}</span></span>
            </div>
            <div style={{ height:4, borderRadius:2, background:'var(--s3)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${(parseFloat(speed)||0.4)/dur*100}%`, background:'var(--grn)', borderRadius:'2px 0 0 2px', opacity:0.7 }} />
              <div style={{ position:'absolute', right:0, top:0, bottom:0, width:`${(parseFloat(speed)||0.4)/dur*100}%`, background:'var(--red)', borderRadius:'0 2px 2px 0', opacity:0.7 }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
              <span style={{ fontSize:8, color:'var(--grn)' }}>↑ Enter</span>
              <span style={{ fontSize:8, color:'var(--t3)' }}>Visible</span>
              <span style={{ fontSize:8, color:'var(--red)' }}>Exit ↓</span>
            </div>
          </div>
        </>
      )}

      {/* Smart Trigger */}
      <SecHead label="⚡ Smart Trigger" />
      <div style={{ marginBottom:14 }}>
        <select value={trig} onChange={e => upT({ trigger: e.target.value })} style={{ ...INP_STYLE, cursor:'pointer', marginBottom:6 }}>
          {TRIGGERS.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
        {trig === 'percent' && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:9, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', minWidth:36 }}>At %</span>
            <input type="number" min={1} max={100} value={timing.triggerValue||75}
              onChange={e => upT({ triggerValue: parseInt(e.target.value)||75 })}
              style={{ ...INP_STYLE, width:60, fontFamily:'monospace', margin:0 }} />
            <span style={{ fontSize:9, color:'var(--t3)' }}>of video watched</span>
          </div>
        )}
        {trig === 'rewind' && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:9, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', minWidth:36 }}>After</span>
            <input type="number" min={1} max={10} value={timing.triggerValue||2}
              onChange={e => upT({ triggerValue: parseInt(e.target.value)||2 })}
              style={{ ...INP_STYLE, width:60, fontFamily:'monospace', margin:0 }} />
            <span style={{ fontSize:9, color:'var(--t3)' }}>rewinds</span>
          </div>
        )}
        {trig === 'pause' && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:9, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', minWidth:36 }}>After</span>
            <input type="number" min={1} max={10} value={timing.triggerValue||3}
              onChange={e => upT({ triggerValue: parseInt(e.target.value)||3 })}
              style={{ ...INP_STYLE, width:60, fontFamily:'monospace', margin:0 }} />
            <span style={{ fontSize:9, color:'var(--t3)' }}>pauses</span>
          </div>
        )}
        {trig === 'idle' && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:9, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', minWidth:36 }}>After</span>
            <input type="number" min={5} max={120} value={timing.triggerValue||15}
              onChange={e => upT({ triggerValue: parseInt(e.target.value)||15 })}
              style={{ ...INP_STYLE, width:60, fontFamily:'monospace', margin:0 }} />
            <span style={{ fontSize:9, color:'var(--t3)' }}>seconds idle</span>
          </div>
        )}
        {trig === 'exit' && (
          <div style={{ fontSize:9, color:'var(--t3)', lineHeight:1.5, padding:'4px 0' }}>
            Triggers when cursor leaves the viewport (desktop) or tab switches (mobile)
          </div>
        )}
      </div>

      {/* Position */}
      <SecHead label="Position" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
        {[['X %','xPct'],['Y %','yPct'],['Width %','wPct'],['Height %','hPct']].map(([lbl, key]) => (
          <Row key={key} label={lbl}>
            <input type="number" min={0} max={100} step={0.1}
              value={Math.round((el[key]??0) * 10) / 10}
              onChange={e => onChange({ ...el, [key]: parseFloat(e.target.value)||0 })}
              style={{ ...INP_STYLE, fontFamily:'monospace' }} />
          </Row>
        ))}
      </div>

      {/* Opacity */}
      <div style={{ marginTop:14 }}>
        <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Opacity</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="range" min={0} max={1} step={0.05} value={el.opacity??1}
            onChange={e => onChange({ ...el, opacity: parseFloat(e.target.value) })}
            style={{ flex:1, accentColor:'var(--acc)' }} />
          <span style={{ fontSize:11, color:'var(--t2)', minWidth:36, fontFamily:'monospace', textAlign:'right' }}>
            {Math.round((el.opacity??1)*100)}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ── ConditionsTab ──────────────────────────────────────────────────────────────
function ConditionsTab({ el, onChange }) {
  const conds  = Array.isArray(el.conditions) ? el.conditions : []
  const setConds = next => onChange({ ...el, conditions: next })
  const add    = () => setConds([...conds, { type:'device', value:'' }])
  const remove = i => setConds(conds.filter((_,j) => j!==i))
  const update = (i, patch) => setConds(conds.map((c,j) => j===i ? { ...c, ...patch } : c))

  const COND_TYPES   = [{v:'source',l:'🌐 Traffic Source'},{v:'device',l:'📱 Device'},{v:'visitor',l:'👤 Visitor Type'},{v:'utm_campaign',l:'🏷 UTM Campaign'},{v:'utm_medium',l:'📣 UTM Medium'},{v:'url_contains',l:'🔗 URL Contains'}]
  const SOURCE_OPTS  = [{v:'facebook',l:'Facebook',e:'📘'},{v:'google',l:'Google',e:'🔍'},{v:'email',l:'Email',e:'📧'},{v:'direct',l:'Direct',e:'🔗'},{v:'instagram',l:'Instagram',e:'📸'},{v:'youtube',l:'YouTube',e:'▶️'},{v:'linkedin',l:'LinkedIn',e:'💼'},{v:'tiktok',l:'TikTok',e:'🎵'}]
  const DEVICE_OPTS  = [{v:'desktop',l:'🖥 Desktop'},{v:'mobile',l:'📱 Mobile'},{v:'tablet',l:'📋 Tablet'}]
  const VISITOR_OPTS = [{v:'new',l:'✨ New Visitor'},{v:'returning',l:'🔄 Returning'},{v:'captured',l:'✅ Known Lead'}]

  function toggleMulti(i, val) {
    const c    = conds[i]
    const vals = (c.value||'').split(',').filter(Boolean)
    const idx  = vals.indexOf(val)
    if (idx > -1) vals.splice(idx, 1); else vals.push(val)
    update(i, { value: vals.join(',') })
  }
  function isOn(cond, val) { return (cond.value||'').split(',').includes(val) }

  function ValSelector({ cond, i }) {
    const t = cond.type
    if (t === 'source') return (
      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
        {SOURCE_OPTS.map(s => {
          const active = isOn(cond, s.v)
          return (
            <button key={s.v} onClick={() => toggleMulti(i, s.v)}
              style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:600, cursor:'pointer',
                border:'1px solid '+(active?'var(--acc)':'var(--b2)'),
                background:active?'rgba(79,110,247,0.1)':'var(--s3)',
                color:active?'var(--acc)':'var(--t2)' }}>
              {s.e} {s.l}
            </button>
          )
        })}
      </div>
    )
    if (t === 'device') return (
      <div style={{ display:'flex', gap:4 }}>
        {DEVICE_OPTS.map(d => {
          const active = isOn(cond, d.v)
          return (
            <button key={d.v} onClick={() => toggleMulti(i, d.v)}
              style={{ flex:1, padding:'6px 4px', borderRadius:6, fontSize:10, fontWeight:600, cursor:'pointer',
                border:'1px solid '+(active?'var(--acc)':'var(--b2)'),
                background:active?'rgba(79,110,247,0.1)':'var(--s3)',
                color:active?'var(--acc)':'var(--t2)' }}>
              {d.l}
            </button>
          )
        })}
      </div>
    )
    if (t === 'visitor') return (
      <div style={{ display:'flex', gap:4 }}>
        {VISITOR_OPTS.map(vt => {
          const active = cond.value === vt.v
          return (
            <button key={vt.v} onClick={() => update(i, { value: vt.v })}
              style={{ flex:1, padding:'6px 4px', borderRadius:6, fontSize:10, fontWeight:600, cursor:'pointer',
                border:'1px solid '+(active?'var(--acc)':'var(--b2)'),
                background:active?'rgba(79,110,247,0.1)':'var(--s3)',
                color:active?'var(--acc)':'var(--t2)' }}>
              {vt.l}
            </button>
          )
        })}
      </div>
    )
    const ph = t==='utm_campaign' ? 'e.g. spring_sale' : t==='utm_medium' ? 'e.g. social, cpc, email' : 'e.g. /sellers, ?offer=vip'
    return <input value={(cond.value||'')} placeholder={ph} onChange={e => update(i, { value: e.target.value })}
      style={{ ...INP_STYLE, fontSize:11, padding:'6px 9px', margin:0 }} />
  }

  return (
    <div>
      <div style={{ textAlign:'center', padding:'2px 0 10px' }}><span style={{ fontSize:20 }}>🎯</span></div>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--t1)', textAlign:'center', marginBottom:3 }}>Show this element only when...</div>
      <div style={{ fontSize:10, color:'var(--t3)', textAlign:'center', lineHeight:1.5, marginBottom:12 }}>No conditions = shows for everyone</div>

      {conds.length === 0 ? (
        <div style={{ background:'var(--s2)', border:'1px solid var(--b2)', borderRadius:10, padding:16, textAlign:'center', marginBottom:12 }}>
          <div style={{ fontSize:24, marginBottom:6, opacity:0.5 }}>✨</div>
          <div style={{ fontSize:11, color:'var(--t3)', marginBottom:10 }}>No conditions set — visible to all viewers</div>
          <button onClick={add}
            style={{ padding:'7px 16px', borderRadius:8, background:'var(--acc)', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            + Add Condition
          </button>
        </div>
      ) : (
        <>
          {conds.map((cond, i) => (
            <div key={i}>
              {i > 0 && <div style={{ textAlign:'center', padding:'4px 0', fontSize:9, fontWeight:700, color:'var(--acc)' }}>AND</div>}
              <div style={{ background:'var(--s2)', border:'1px solid var(--b2)', borderRadius:9, padding:10, marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <select value={cond.type} onChange={e => update(i, { type: e.target.value, value:'' })}
                    style={{ flex:1, background:'var(--s3)', border:'1px solid var(--b2)', borderRadius:7, padding:'5px 8px', fontSize:11, color:'var(--t1)', cursor:'pointer' }}>
                    {COND_TYPES.map(ct => <option key={ct.v} value={ct.v}>{ct.l}</option>)}
                  </select>
                  <button onClick={() => remove(i)}
                    style={{ flexShrink:0, width:22, height:22, borderRadius:5, background:'none', border:'1px solid var(--b2)', color:'var(--red)', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:6 }}>
                    ✕
                  </button>
                </div>
                <ValSelector cond={cond} i={i} />
              </div>
            </div>
          ))}
          <button onClick={add}
            style={{ width:'100%', padding:6, borderRadius:8, background:'var(--s3)', border:'1px solid var(--b2)', color:'var(--t2)', fontSize:10, fontWeight:600, cursor:'pointer', marginTop:4 }}>
            + Add Condition
          </button>
        </>
      )}

      {/* Example hint */}
      <div style={{ marginTop:14, background:'var(--s2)', border:'1px solid var(--b2)', borderRadius:8, padding:'10px 12px' }}>
        <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Example</div>
        <div style={{ fontSize:10, color:'var(--t2)', lineHeight:1.6 }}>
          Show a "Book a Call" CTA only to <strong style={{ color:'var(--acc)' }}>Facebook</strong> traffic on <strong style={{ color:'var(--acc)' }}>Desktop</strong> — while mobile viewers from <strong style={{ color:'var(--acc)' }}>Email</strong> see a tap-to-call button instead.
        </div>
      </div>
    </div>
  )
}

// ── Layers panel (bottom of properties) ─────────────────────────────────────
function LayersPanel({ elements, selectedId, onSelect }) {
  return (
    <div style={{ borderTop:'1px solid var(--b1)', padding:'11px 14px', flexShrink:0 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12,2 2,7 12,12 22,7"/>
          <polyline points="2,17 12,22 22,17"/>
          <polyline points="2,12 12,17 22,12"/>
        </svg>
        Layers ({elements.length})
      </div>
      <div style={{ maxHeight:120, overflowY:'auto' }}>
        {elements.length === 0
          ? <div style={{ fontSize:11, color:'var(--t3)' }}>No elements</div>
          : [...elements].reverse().map(el => {
              const meta   = EL_TYPES[el.type] || { icon:'⚡', label:el.type, color:'#4F6EF7' }
              const active = el.id === selectedId
              const name   = el.props?.headline || el.props?.text || el.props?.question || el.props?.label || meta.label
              return (
                <div key={el.id} onClick={() => onSelect(el.id)}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 7px', borderRadius:7, marginBottom:3, cursor:'pointer',
                    background:active?'rgba(79,110,247,0.1)':'transparent',
                    border:`1px solid ${active?'rgba(79,110,247,0.25)':'transparent'}` }}
                  onMouseOver={e => !active && (e.currentTarget.style.background = 'var(--s2)')}
                  onMouseOut={e  => !active && (e.currentTarget.style.background  = 'transparent')}>
                  <span style={{ fontSize:13 }}>{meta.icon}</span>
                  <span style={{ fontSize:11, fontWeight:active?700:400, color:active?'var(--t1)':'var(--t2)', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</span>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:meta.color, flexShrink:0 }} />
                </div>
              )
            })
        }
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function ElementProperties({ element, elements = [], onChange, onDelete, onSelect }) {
  const [tab, setTab] = useState('props')

  const meta     = element ? (EL_TYPES[element.type] || { icon:'⚡', label:element.type, color:'#4F6EF7', desc:'' }) : null
  const showGate = !element || GATEABLE.has(element.type)
  const gateOn   = !!element?.gate?.enabled

  const TABS = [
    { id:'props',      label:'Properties' },
    { id:'gate',       label:'Gate',       hidden:!showGate },
    { id:'timing',     label:'Timing' },
    { id:'conditions', label:'Conditions' },
  ].filter(t => !t.hidden)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── Tab bar ── */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--b1)', flexShrink:0 }}>
        {TABS.map(t => {
          const isActive = tab === t.id
          const isGateTab = t.id === 'gate'
          // Gate tab uses green color when active and gate is on
          const tabColor = isActive
            ? (isGateTab && gateOn ? 'var(--grn)' : 'var(--t1)')
            : 'var(--t3)'
          const borderColor = isActive
            ? (isGateTab && gateOn ? 'var(--grn)' : 'var(--acc)')
            : 'transparent'
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, padding:'9px 4px', fontSize:11, fontWeight:isActive?700:500, cursor:'pointer',
                background:'transparent', border:'none', color:tabColor,
                borderBottom:`2px solid ${borderColor}`,
                position:'relative', transition:'all 0.15s' }}>
              {t.label}
              {isGateTab && gateOn && !isActive && (
                <span style={{ position:'absolute', top:6, right:8, width:6, height:6, borderRadius:'50%', background:'var(--grn)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── No element selected ── */}
      {!element ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 16px', color:'var(--t3)' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>👆</div>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--t2)', marginBottom:4 }}>No element selected</div>
          <div style={{ fontSize:11, lineHeight:1.5, textAlign:'center' }}>Click an element on the canvas to edit its properties</div>
        </div>
      ) : (
        <>
          {/* ── Element header ── */}
          <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--b1)', flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
              background:`${meta.color}22`, border:`1px solid ${meta.color}44`,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
              {meta.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--t1)', lineHeight:1.2 }}>{meta.label}</div>
              <div style={{ fontSize:9, color:'var(--t3)' }}>{meta.desc||''}</div>
            </div>
            <button onClick={() => onDelete(element.id)}
              style={{ width:24, height:24, borderRadius:6, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontSize:12, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              ✕
            </button>
          </div>

          {/* ── Tab content ── */}
          <div style={{ flex:1, overflowY:'auto', padding: '14px'  }}>
            {tab === 'props'      && <PropsTab       el={element} onChange={onChange} />}
            {tab === 'gate'       && <GateTab        el={element} onChange={onChange} />}
            {tab === 'timing'     && <TimingTab      el={element} onChange={onChange} />}
            {tab === 'conditions' && <ConditionsTab  el={element} onChange={onChange} />}
          </div>
        </>
      )}

      {/* ── Layers (always visible at bottom) ── */}
      <LayersPanel elements={elements} selectedId={element?.id} onSelect={onSelect} />
    </div>
  )
}