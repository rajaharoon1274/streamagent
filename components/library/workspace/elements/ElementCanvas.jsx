'use client'
import { useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { EL_TYPES } from './elTypes'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(sec) {
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

// ── Full-screen type check (no resize handles, full canvas) ──────────────────
const FS_SET = new Set([
  'funnel-urgency','cta-email','cta-booking','cta-download',
  'survey-poll','survey-rating','survey-nps',
])
function isFullScreen(type) { return FS_SET.has(type) }

// ── renderElContentStr — visual HTML content per element type ─────────────────
function renderElContentStr(el) {
  const p   = el.props || {}
  const def = EL_TYPES[el.type] || { color: '#4F6EF7', icon: '⚡', label: el.type }

  switch (el.type) {
    case 'cta-email': {
      const fld = `<div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:7px;padding:7px 10px;font-size:10px;color:rgba(255,255,255,0.25);margin-bottom:6px;text-align:left">`
      return `<div style="width:100%;height:100%;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:linear-gradient(135deg,#0e1428ee,#080f20ee);backdrop-filter:blur(8px)"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="background:rgba(7,9,15,0.92);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:5% 6%;width:90%;max-width:340px;box-shadow:0 24px 64px rgba(0,0,0,0.6);text-align:center"><div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:4px;line-height:1.3">${p.headline || 'Get the free playbook'}</div><div style="font-size:10px;color:rgba(255,255,255,0.45);margin-bottom:10px;line-height:1.5">${p.sub || "Drop your email and we'll send it instantly"}</div>${p.collectName ? fld + 'Your name</div>' : ''}${fld}your@email.com</div>${p.collectPhone ? fld + 'Phone (optional)</div>' : ''}<div style="background:${p.buttonColor || '#4F6EF7'};border-radius:9px;padding:10px;font-size:11px;font-weight:800;color:#fff;letter-spacing:0.3px">${p.buttonText || 'Send Me the Playbook'}</div></div></div></div>`
    }
    case 'cta-booking':
      return `<div style="width:100%;height:100%;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:linear-gradient(135deg,#0e1428ee,#080f20ee);backdrop-filter:blur(8px)"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="background:rgba(7,9,15,0.92);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:5% 6%;width:90%;max-width:360px;box-shadow:0 24px 64px rgba(0,0,0,0.6);text-align:center"><div style="font-size:28px;margin-bottom:10px">📅</div><div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:6px;line-height:1.3">${p.headline || 'Book a free strategy call'}</div><div style="font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:18px;line-height:1.5">${p.sub || '30 minutes. No pitch.'}</div><div style="background:${p.buttonColor || '#A855F7'};border-radius:10px;padding:12px;font-size:12px;font-weight:800;color:#fff;letter-spacing:0.3px">${p.buttonText || 'Reserve My Spot'}</div></div></div></div>`
    case 'cta-download':
      return `<div style="width:100%;height:100%;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:linear-gradient(135deg,#0e1428ee,#080f20ee);backdrop-filter:blur(8px)"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="background:rgba(7,9,15,0.92);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:5% 6%;width:90%;max-width:360px;box-shadow:0 24px 64px rgba(0,0,0,0.6);text-align:center"><div style="font-size:28px;margin-bottom:10px">⬇️</div><div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:18px;line-height:1.3">${p.headline || 'Download the free playbook'}</div><div style="background:${p.buttonColor || '#F5A623'};border-radius:10px;padding:12px;font-size:12px;font-weight:800;color:#fff;letter-spacing:0.3px">${p.buttonText || 'Download Now'}</div></div></div></div>`
    case 'funnel-urgency': {
      const gc  = p.buttonColor || '#FF6B6B'
      const pct = p.progressPct || 50
      return `<div style="width:100%;height:100%;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:linear-gradient(135deg,#0e1428ee,#080f20ee);backdrop-filter:blur(8px)"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px"><div style="background:rgba(7,9,15,0.92);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:4% 5%;width:90%;max-width:310px;box-shadow:0 24px 64px rgba(0,0,0,0.6)"><div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px">Your Progress</span><span style="font-size:9px;font-weight:700;color:${gc}">${pct}% Completed</span></div><div style="height:5px;border-radius:100px;background:rgba(255,255,255,0.08)"><div style="width:${pct}%;height:100%;border-radius:100px;background:${gc}"></div></div></div><div style="font-size:12px;font-weight:800;color:#fff;margin-bottom:3px;line-height:1.3;text-align:center">${p.headline || 'Want to Continue Watching?'}</div><div style="font-size:10px;color:rgba(255,255,255,0.45);margin-bottom:14px;text-align:center">${p.subheadline || 'Enter Your Details Below'}</div>${p.collectName ? '<div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:6px 9px;font-size:9px;color:rgba(255,255,255,0.25);margin-bottom:5px">Your name</div>' : ''}<div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:6px 9px;font-size:9px;color:rgba(255,255,255,0.25);margin-bottom:5px">your@email.com</div>${p.collectPhone ? '<div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:6px 9px;font-size:9px;color:rgba(255,255,255,0.25);margin-bottom:5px">Phone (optional)</div>' : ''}${p.urgencyText ? `<div style="display:flex;align-items:center;justify-content:center;gap:5px;padding:7px 10px;border-radius:8px;background:${gc}14;border:1px solid ${gc}30;margin-bottom:10px"><span style="font-size:10px">⚡</span><span style="font-size:10px;font-weight:600;color:${gc}">${p.urgencyText}</span></div>` : ''}<div style="background:${gc};border-radius:9px;padding:10px;font-size:11px;font-weight:800;color:#fff;text-align:center;letter-spacing:0.3px">${p.buttonText || 'Continue Watching →'}</div></div></div></div>`
    }
    case 'cta-button':
      return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><div style="background:${p.buttonColor || '#1ED8A0'};border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;color:#fff;white-space:nowrap">${p.text || 'Learn More →'}</div></div>`
    case 'overlay-text':
      return `<div style="width:100%;height:100%;background:${p.background || 'rgba(0,0,0,0.5)'};border-radius:7px;display:flex;align-items:center;justify-content:${p.align === 'left' ? 'flex-start' : 'center'};padding:6px 12px"><span style="font-size:${p.fontSize || 20}px;font-weight:700;color:${p.color || '#EEF2FF'}">${p.text || 'Your compelling headline here'}</span></div>`
    case 'overlay-countdown':
      return `<div style="width:100%;height:100%;background:rgba(10,13,24,0.9);border:1px solid ${p.color || '#F5A623'}33;border-radius:9px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px"><div style="font-size:10px;font-weight:600;color:${p.color || '#F5A623'};text-transform:uppercase;letter-spacing:.5px">${p.label || 'Offer ends in'}</div><div style="font-family:monospace;font-size:24px;font-weight:700;color:${p.color || '#F5A623'}">${String(p.minutes || 10).padStart(2,'0')}:${String(p.seconds || 0).padStart(2,'0')}</div></div>`
    case 'overlay-chapter':
      return `<div style="width:100%;height:100%;background:rgba(10,13,24,0.88);border-left:3px solid ${p.color || '#1ED8A0'};padding:9px 14px;display:flex;flex-direction:column;justify-content:center;border-radius:0 7px 7px 0"><div style="font-size:9px;font-weight:700;color:${p.color || '#1ED8A0'};text-transform:uppercase;letter-spacing:0.7px;margin-bottom:2px">${p.chapter || 'Chapter 1'}</div><div style="font-size:15px;font-weight:800;color:#EEF2FF;letter-spacing:-0.3px">${p.title || 'Introduction'}</div></div>`
    case 'share-social':
      return `<div style="width:100%;height:100%;background:rgba(10,13,24,0.9);border:1px solid rgba(255,255,255,0.08);border-radius:9px;display:flex;align-items:center;justify-content:center;gap:10px;padding:0 14px"><span style="font-size:10px;color:rgba(123,135,160,0.7)">${p.label || 'Share this video'}</span><div style="width:28px;height:28px;border-radius:7px;background:${p.color || '#F06292'}22;border:1px solid ${p.color || '#F06292'}44;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${p.color || '#F06292'}">f</div><div style="width:28px;height:28px;border-radius:7px;background:${p.color || '#F06292'}22;border:1px solid ${p.color || '#F06292'}44;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${p.color || '#F06292'}">in</div></div>`
    case 'sticky-bar':
      return `<div style="width:100%;height:100%;background:${p.barBg || 'rgba(7,9,15,0.92)'};border:1px solid rgba(255,255,255,0.1);border-radius:6px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;gap:12px"><span style="font-size:12px;font-weight:600;color:#fff;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.text || '🔥 Limited spots — Book your free call'}</span><div style="background:${p.buttonColor || '#FF6B6B'};border-radius:7px;padding:8px 16px;font-size:11px;font-weight:800;color:#fff;white-space:nowrap;flex-shrink:0">${p.buttonText || 'Book Now →'}</div></div>`
    case 'annotation-link':
      return `<div style="width:100%;height:100%;background:rgba(7,9,15,0.92);border:1px solid ${p.color || '#A855F7'}44;border-radius:10px;display:flex;align-items:center;gap:10px;padding:10px 14px"><div style="width:40px;height:40px;border-radius:8px;background:${p.color || '#A855F7'}22;border:1px solid ${p.color || '#A855F7'}44;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${p.thumbnailEmoji || '🎬'}</div><div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title || 'Watch Next'}</div><div style="font-size:9px;color:rgba(255,255,255,0.4)">${p.sub || 'Advanced Strategy Session'}</div></div><div style="font-size:14px;color:${p.color || '#A855F7'}">›</div></div>`
    case 'image-clickable':
      return p.imageUrl
        ? `<div style="width:100%;height:100%;border-radius:${p.borderRadius || 8}px;overflow:hidden"><img src="${p.imageUrl}" style="width:100%;height:100%;object-fit:contain;display:block"/></div>`
        : `<div style="width:100%;height:100%;border:2px dashed rgba(6,182,212,0.4);border-radius:8px;background:rgba(6,182,212,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px"><div style="font-size:24px;opacity:0.5">🖼️</div><div style="font-size:10px;font-weight:600;color:rgba(6,182,212,0.7)">No image set</div><div style="font-size:9px;color:rgba(6,182,212,0.4)">Select in properties →</div></div>`
    case 'survey-poll': {
      const opts = p.options || ['More leads', 'Better conversions', 'Build my brand', 'Save time']
      const optCount = opts.length
      // Responsive sizing based on number of options
      const fontSize = optCount <= 4 ? '15px' : optCount === 5 ? '13px' : '12px'
      const padding = optCount <= 4 ? '5% 6%' : '4% 5%'
      const optGap = optCount <= 4 ? '8px' : '6px'
      const optPadding = optCount <= 4 ? '10px 14px' : optCount === 5 ? '8px 12px' : '6px 10px'
      const optFontSize = optCount <= 4 ? '12px' : '11px'
      const questionMargin = optCount <= 4 ? '16px' : '12px'
      return `<div style="width:100%;height:100%;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:linear-gradient(135deg,#0e1428ee,#080f20ee);backdrop-filter:blur(8px)"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="background:rgba(7,9,15,0.92);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:${padding};width:90%;max-width:380px;box-shadow:0 24px 64px rgba(0,0,0,0.6)"><div style="font-size:${fontSize};font-weight:800;color:#fff;margin-bottom:${questionMargin};text-align:center;line-height:1.3">${p.question || 'What matters most to you?'}</div><div style="display:flex;flex-direction:column;gap:${optGap};margin-bottom:${questionMargin}">${opts.map((opt, i) => `<div style="display:flex;align-items:center;gap:10px;padding:${optPadding};border-radius:10px;background:${i === 0 ? (p.buttonColor || '#A855F7') + '18' : 'rgba(255,255,255,0.04)'};border:1px solid ${i === 0 ? (p.buttonColor || '#A855F7') + '44' : 'rgba(255,255,255,0.08)'};font-size:${optFontSize};color:#EEF2FF"><div style="width:16px;height:16px;border-radius:50%;border:2px solid ${i === 0 ? (p.buttonColor || '#A855F7') : 'rgba(255,255,255,0.25)'};flex-shrink:0;background:${i === 0 ? (p.buttonColor || '#A855F7') : 'transparent'}"></div>${opt}</div>`).join('')}</div><div style="background:${p.buttonColor || '#A855F7'};border-radius:10px;padding:12px;font-size:12px;font-weight:800;color:#fff;text-align:center;letter-spacing:0.3px">${p.buttonText || 'Submit Answer'}</div></div></div></div>`
    }
    case 'survey-rating':
      return `<div style="width:100%;height:100%;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:linear-gradient(135deg,#0e1428ee,#080f20ee);backdrop-filter:blur(8px)"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="background:rgba(7,9,15,0.92);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:28px 32px;width:100%;max-width:340px;box-shadow:0 24px 64px rgba(0,0,0,0.6);text-align:center"><div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:16px">${p.question || 'How valuable was this information?'}</div><div style="display:flex;justify-content:center;gap:10px;font-size:28px;margin-bottom:18px">⭐⭐⭐☆☆</div><div style="background:${p.buttonColor || '#F5A623'};border-radius:10px;padding:12px;font-size:12px;font-weight:800;color:#fff">${p.buttonText || 'Submit Rating'}</div></div></div></div>`
    case 'survey-nps':
      return `<div style="width:100%;height:100%;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:linear-gradient(135deg,#0e1428ee,#080f20ee);backdrop-filter:blur(8px)"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="background:rgba(7,9,15,0.92);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:5% 6%;width:90%;max-width:400px;box-shadow:0 24px 64px rgba(0,0,0,0.6);text-align:center"><div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:16px">${p.question || 'How likely are you to recommend us?'}</div><div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin-bottom:10px">${Array.from({length:11},(_,i)=>`<div style="width:28px;height:28px;border-radius:7px;background:${i<=3?'rgba(255,107,107,0.2)':i<=6?'rgba(245,166,35,0.2)':'rgba(30,216,160,0.2)'};border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#EEF2FF">${i}</div>`).join('')}</div><div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:16px;padding:0 4px"><span>${p.lowLabel || 'Not likely'}</span><span>${p.highLabel || 'Very likely'}</span></div><div style="background:${p.buttonColor || '#06B6D4'};border-radius:10px;padding:12px;font-size:12px;font-weight:800;color:#fff">${p.buttonText || 'Submit'}</div></div></div></div>`
    case 'mob-call':
      return `<div style="width:100%;height:100%;background:${p.bgColor || '#1ED8A0'};border-radius:100px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 16px;position:relative"><div style="position:absolute;top:3px;right:8px;font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.2);padding:1px 5px;border-radius:100px">📱 Mobile</div><span style="font-size:16px">📞</span><div><div style="font-size:12px;font-weight:800;color:#fff">${p.label || 'Call Now'}</div>${p.subtitle ? `<div style="font-size:9px;color:rgba(255,255,255,0.7)">${p.subtitle}</div>` : ''}</div></div>`
    case 'mob-sms':
      return `<div style="width:100%;height:100%;background:${p.bgColor || '#4F6EF7'};border-radius:100px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 16px;position:relative"><div style="position:absolute;top:3px;right:8px;font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.2);padding:1px 5px;border-radius:100px">📱 Mobile</div><span style="font-size:16px">💬</span><span style="font-size:12px;font-weight:800;color:#fff">${p.label || 'Text Us'}</span></div>`
    case 'mob-vcard':
      return `<div style="width:100%;height:100%;background:${p.bgColor || '#A855F7'};border-radius:14px;display:flex;align-items:center;gap:10px;padding:0 14px;position:relative"><div style="position:absolute;top:3px;right:8px;font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.2);padding:1px 5px;border-radius:100px">📱 Mobile</div><div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">👤</div><div><div style="font-size:12px;font-weight:800;color:#fff">${p.label || 'Save My Contact'}</div><div style="font-size:9px;color:rgba(255,255,255,0.65)">${p.name || 'Saves to phone contacts'}</div></div></div>`
    case 'mob-calendar':
      return `<div style="width:100%;height:100%;background:${p.bgColor || '#F5A623'};border-radius:14px;display:flex;align-items:center;gap:10px;padding:0 14px;position:relative"><div style="position:absolute;top:3px;right:8px;font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.2);padding:1px 5px;border-radius:100px">📱 Mobile</div><div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">📅</div><div><div style="font-size:12px;font-weight:800;color:#fff">${p.label || 'Add to Calendar'}</div><div style="font-size:9px;color:rgba(255,255,255,0.65)">${p.eventTitle || 'Adds event to your calendar'}</div></div></div>`
    case 'mob-swipe':
      return `<div style="width:100%;height:100%;background:linear-gradient(180deg,transparent 0%,${p.bgColor || '#FF6B6B'}44 40%,${p.bgColor || '#FF6B6B'} 100%);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 16px 12px;position:relative"><div style="position:absolute;top:3px;right:8px;font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.2);padding:1px 5px;border-radius:100px">📱 Mobile</div><div style="font-size:18px;margin-bottom:2px">👆</div><div style="font-size:11px;font-weight:800;color:#fff;text-align:center">${p.label || 'Swipe Up to Learn More'}</div></div>`
    case 'mob-share':
      return `<div style="width:100%;height:100%;background:${p.bgColor || '#06B6D4'};border-radius:100px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 16px;position:relative"><div style="position:absolute;top:3px;right:8px;font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.2);padding:1px 5px;border-radius:100px">📱 Mobile</div><span style="font-size:16px">📤</span><span style="font-size:12px;font-weight:800;color:#fff">${p.label || 'Share with a Friend'}</span></div>`
    case 'mob-directions':
      return `<div style="width:100%;height:100%;background:${p.bgColor || '#FF6B35'};border-radius:14px;display:flex;align-items:center;gap:10px;padding:0 14px;position:relative"><div style="position:absolute;top:3px;right:8px;font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.2);padding:1px 5px;border-radius:100px">📱 Mobile</div><div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">📍</div><div><div style="font-size:12px;font-weight:800;color:#fff">${p.label || 'Get Directions'}</div><div style="font-size:9px;color:rgba(255,255,255,0.65)">${p.address || 'Opens in Maps'}</div></div></div>`
    case 'mob-screenshot':
      return `<div style="width:100%;height:100%;background:${p.bgColor || '#0F172A'};border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;justify-content:center;border:1px solid ${p.accentColor || '#F06292'}44;position:relative"><div style="position:absolute;top:3px;right:8px;font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.2);padding:1px 5px;border-radius:100px">📱 Mobile</div><div style="font-size:8px;font-weight:700;color:${p.accentColor || '#F06292'};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">📸 ${p.headline || 'Save This Info'}</div>${p.line1 ? `<div style="font-size:11px;font-weight:700;color:#fff;margin-bottom:2px">${p.line1}</div>` : ''}${p.line2 ? `<div style="font-size:10px;color:rgba(255,255,255,0.6)">${p.line2}</div>` : ''}</div>`
    case 'mob-shake':
      return `<div style="width:100%;height:100%;background:linear-gradient(135deg,${p.bgColor || '#FFD700'}22,${p.bgColor || '#FFD700'}44);border:2px dashed ${p.bgColor || '#FFD700'}66;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;position:relative"><div style="position:absolute;top:3px;right:8px;font-size:7px;font-weight:700;color:${p.bgColor || '#FFD700'};background:${p.bgColor || '#FFD700'}22;padding:1px 5px;border-radius:100px">📱 Mobile</div><div style="font-size:24px">🫨</div><div style="font-size:11px;font-weight:700;color:${p.bgColor || '#FFD700'};text-align:center">${p.promptText || 'Shake your phone!'}</div></div>`
    default:
      return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:${def.color}18;border:1px solid ${def.color}33;border-radius:8px"><div style="font-size:24px">${def.icon || '⚡'}</div><div style="font-size:10px;font-weight:700;color:${def.color}">${def.label || el.type}</div></div>`
  }
}

// ── CanvasElement — positioned, draggable, 8-handle resizable ─────────────────
function CanvasElement({ el, selected, onSelect, onChange, onDelete }) {
  const meta   = EL_TYPES[el.type] || { icon: '⚡', label: el.type, color: '#4F6EF7' }
  const fs     = isFullScreen(el.type)
  const xPct   = el.xPct ?? 5
  const yPct   = el.yPct ?? 5
  const wPct   = el.wPct ?? 40
  const hPct   = el.hPct ?? 25

  function handleMouseDown(e) {
    if (e.button !== 0) return
    if (e.target.dataset.handle) return
    e.preventDefault()
    e.stopPropagation()
    onSelect(el.id)
    const startX    = e.clientX
    const startY    = e.clientY
    const startXPct = el.xPct ?? 5
    const startYPct = el.yPct ?? 5
    const canvas = e.currentTarget.closest('[data-el-canvas]')
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    function onMove(me) {
      const dx   = ((me.clientX - startX) / rect.width)  * 100
      const dy   = ((me.clientY - startY) / rect.height) * 100
      const newX = Math.max(0, Math.min(100 - wPct, startXPct + dx))
      const newY = Math.max(0, Math.min(100 - hPct, startYPct + dy))
      onChange({ ...el, xPct: newX, yPct: newY })
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }

  function handleResize(e, corner) {
    e.preventDefault()
    e.stopPropagation()
    const canvas = e.currentTarget.closest('[data-el-canvas]')
    if (!canvas) return
    const rect   = canvas.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const snap   = { xPct: el.xPct ?? 5, yPct: el.yPct ?? 5, wPct: el.wPct ?? 40, hPct: el.hPct ?? 25 }
    function onMove(me) {
      const dx = ((me.clientX - startX) / rect.width)  * 100
      const dy = ((me.clientY - startY) / rect.height) * 100
      let { xPct: nx, yPct: ny, wPct: nw, hPct: nh } = snap
      if (corner.includes('r')) nw = Math.max(5, snap.wPct + dx)
      if (corner.includes('l')) { nw = Math.max(5, snap.wPct - dx); nx = Math.min(snap.xPct + dx, snap.xPct + snap.wPct - 5) }
      if (corner.includes('b')) nh = Math.max(3, snap.hPct + dy)
      if (corner.includes('t')) { nh = Math.max(3, snap.hPct - dy); ny = Math.min(snap.yPct + dy, snap.yPct + snap.hPct - 3) }
      onChange({ ...el, xPct: Math.max(0, nx), yPct: Math.max(0, ny), wPct: nw, hPct: nh })
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }

  const HANDLES = [
    { id: 'tl', top: '0%',   left: '0%',   cursor: 'nw-resize' },
    { id: 'tc', top: '0%',   left: '50%',  cursor: 'n-resize'  },
    { id: 'tr', top: '0%',   left: '100%', cursor: 'ne-resize' },
    { id: 'ml', top: '50%',  left: '0%',   cursor: 'w-resize'  },
    { id: 'mr', top: '50%',  left: '100%', cursor: 'e-resize'  },
    { id: 'bl', top: '100%', left: '0%',   cursor: 'sw-resize' },
    { id: 'bc', top: '100%', left: '50%',  cursor: 's-resize'  },
    { id: 'br', top: '100%', left: '100%', cursor: 'se-resize' },
  ]

  // Condition labels
  let condLabel = ''
  let condHidden = false
  if (el.conditions?.length > 0) {
    el.conditions.forEach(c => {
      if (c.type === 'device') {
        const vals = (c.value || '').split(',')
        if (vals.includes('mobile') && !vals.includes('desktop')) { condLabel = '📱 Mobile only'; condHidden = true }
        else if (vals.includes('desktop') && !vals.includes('mobile')) condLabel = '🖥 Desktop only'
      }
    })
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left:   `${xPct}%`,
        top:    `${yPct}%`,
        width:  `${wPct}%`,
        height: `${hPct}%`,
        cursor: 'move',
        userSelect: 'none',
        zIndex: selected ? 999 : (el.zIndex || 1),
        outline: selected ? `2px solid ${meta.color}` : 'none',
        outlineOffset: 2,
        boxShadow: selected ? `0 0 0 4px ${meta.color}33` : 'none',
        borderRadius: fs ? 0 : 9,
        opacity: el.opacity ?? 1,
      }}
    >
      {/* Rich element content */}
      <div
        style={{ width: '100%', height: '100%', borderRadius: fs ? 0 : 9, overflow: 'hidden', pointerEvents: 'none' }}
        dangerouslySetInnerHTML={{ __html: renderElContentStr(el) }}
      />

      {/* Full-screen gate badge */}
      {selected && fs && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, padding: '3px 8px', fontSize: 9,
          color: 'rgba(238,242,255,0.6)', display: 'flex', alignItems: 'center', gap: 4,
          pointerEvents: 'none', zIndex: 10,
        }}>
          🔒 Full-screen gate
        </div>
      )}

      {/* Condition label badge */}
      {condLabel && (
        <div style={{
          position: 'absolute',
          bottom: fs ? 6 : 'auto', top: fs ? 'auto' : -18,
          left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          border: `1px solid ${condHidden ? 'rgba(245,166,35,0.4)' : 'rgba(79,110,247,0.4)'}`,
          borderRadius: 5, padding: '2px 7px', fontSize: 8, fontWeight: 700,
          color: condHidden ? '#F5A623' : '#818CF8',
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
        }}>
          {condLabel}
        </div>
      )}

      {/* Selection handles + delete (non-fullscreen only) */}
      {selected && !fs && (
        <>
          {HANDLES.map(h => (
            <div
              key={h.id}
              data-handle={h.id}
              onMouseDown={e => handleResize(e, h.id)}
              style={{
                position: 'absolute',
                width: 8, height: 8,
                background: meta.color,
                border: '1.5px solid #fff',
                borderRadius: 2,
                cursor: h.cursor,
                transform: 'translate(-50%, -50%)',
                top: h.top, left: h.left,
                zIndex: 10,
              }}
            />
          ))}
          <button
            data-handle="delete"
            onMouseDown={e => { e.stopPropagation(); onDelete(el.id) }}
            style={{
              position: 'absolute', top: -14, right: -4,
              width: 18, height: 18, borderRadius: 5,
              background: '#EF4444', border: 'none',
              color: '#fff', fontSize: 9, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 11, fontWeight: 700,
            }}
          >✕</button>
        </>
      )}
    </div>
  )
}

// ── Full Timeline — ruler + track lanes with clip drag/resize ─────────────────
function Timeline({ elements, duration, currentTime, onSeek, onElementUpdate, selectedId, onSelect, playing, onTogglePlay, accentColor }) {
  const dur      = duration || 180
  const pct      = dur > 0 ? (currentTime / dur) * 100 : 0
  const rulerRef = useRef(null)
  const step     = dur <= 60 ? 5 : dur <= 120 ? 10 : dur <= 300 ? 30 : 60
  const accent   = accentColor || '#4F6EF7'

  const marks = []
  for (let s = 0; s <= dur; s += step) marks.push(s)

  // Percentage markers at 25%, 50%, 75%
  const PCT_MARKS = [
    { pct: 25, color: '#1ED8A0' },
    { pct: 50, color: '#F5A623' },
    { pct: 75, color: '#FF6B6B' },
  ]

  function handleRulerDown(e) {
    const rect = rulerRef.current?.getBoundingClientRect()
    if (!rect) return
    const scrub = (me) => {
      const ratio = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width))
      onSeek(ratio * dur)
    }
    scrub(e) // immediate seek on mousedown
    function onMove(me) { scrub(me) }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function handleClipDrag(el, e) {
    e.preventDefault()
    e.stopPropagation()
    onSelect(el.id)
    const lane     = document.getElementById(`tl-lane-${el.id}`)
    if (!lane) return
    const laneRect = lane.getBoundingClientRect()
    const clip     = document.getElementById(`tl-clip-${el.id}`)
    const clipRect = clip?.getBoundingClientRect()
    const offPct   = clipRect ? (e.clientX - clipRect.left) / laneRect.width : 0
    function onMove(me) {
      const raw   = (me.clientX - laneRect.left) / laneRect.width - offPct
      const ratio = Math.max(0, Math.min(1, raw))
      const maxIn = Math.max(0, dur - (el.timing?.duration ?? 5))
      const newIn = Math.min(Math.round(ratio * dur), maxIn)
      onElementUpdate({ ...el, timing: { ...(el.timing || {}), in: newIn } })
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }

  function handleResizeDrag(el, e) {
    e.preventDefault()
    e.stopPropagation()
    const lane = document.getElementById(`tl-lane-${el.id}`)
    if (!lane) return
    const laneRect = lane.getBoundingClientRect()
    const startX   = e.clientX
    const startDur = el.timing?.duration ?? 5
    function onMove(me) {
      const dx     = me.clientX - startX
      const dSec   = (dx / laneRect.width) * dur
      const maxDur = dur - (el.timing?.in ?? 0)
      const newDur = Math.max(1, Math.min(Math.round(startDur + dSec), maxDur))
      onElementUpdate({ ...el, timing: { ...(el.timing || {}), duration: newDur } })
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }

  // ADDED: Click empty area of a lane to reposition element start time (HTML: tlLaneClick)
  function handleLaneClick(el, e) {
    // Don't fire if we clicked the clip itself
    const clip = document.getElementById(`tl-clip-${el.id}`)
    if (clip) {
      const cr = clip.getBoundingClientRect()
      if (e.clientX >= cr.left && e.clientX <= cr.right) return
    }
    const lane = document.getElementById(`tl-lane-${el.id}`)
    if (!lane) return
    const rect = lane.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newIn = Math.round(ratio * dur)
    onElementUpdate({ ...el, timing: { ...(el.timing || {}), in: newIn } })
    onSelect(el.id)
  }

  return (
    <div style={{ borderTop: '1px solid var(--b1)', flexShrink: 0, overflow: 'hidden', paddingBottom: 20 }}>

      {/* ── Timeline header bar (play/pause, time, element count) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderBottom: '1px solid var(--b1)' }}>
        <button
          onClick={onTogglePlay}
          style={{
            width: 26, height: 26, borderRadius: '50%', background: accent, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
          }}
        >
          {playing
            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>
            : <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><polygon points="6,4 20,12 6,20"/></svg>
          }
        </button>
        <span style={{ fontSize: 11, color: 'var(--t1)', fontFamily: 'var(--mono,monospace)' }}>{fmt(currentTime)}</span>
        <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono,monospace)' }}>/ {fmt(dur)}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--t3)' }}>
          {elements.length} element{elements.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Scrollable lanes area ── */}
      <div style={{ overflowY: 'auto', maxHeight: 180 }}>

        {/* Ruler header */}
        <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--b1)', background: 'var(--s3)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 4 }}>
          <div style={{ width: 96, flexShrink: 0, padding: '4px 10px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--b1)' }}>
            Track
          </div>
          <div
            ref={rulerRef}
            onMouseDown={handleRulerDown}
            style={{ flex: 1, position: 'relative', height: 24, cursor: 'pointer', overflow: 'hidden' }}
          >
            {/* Playhead */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct}%`, width: 2, background: accent, transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 5 }}>
              <div style={{ width: 8, height: 8, background: accent, borderRadius: '50%', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }} />
            </div>
            {/* Timestamp marks */}
            {marks.map(s => (
              <div key={s} style={{ position: 'absolute', top: 0, left: `${(s / dur) * 100}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                <div style={{ width: 1, height: 8, background: 'rgba(255,255,255,0.12)' }} />
                <span style={{ fontSize: 8, color: 'var(--t3)', fontFamily: 'monospace', marginTop: 1, whiteSpace: 'nowrap' }}>{fmt(s)}</span>
              </div>
            ))}
            {/* Percentage markers (25%, 50%, 75%) */}
            {PCT_MARKS.map(pm => (
              <div key={pm.pct} style={{ position: 'absolute', bottom: 0, left: `${pm.pct}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', zIndex: 2 }}>
                <div style={{ fontSize: 6, fontWeight: 800, color: pm.color, background: `${pm.color}18`, padding: '0px 3px', borderRadius: 2, lineHeight: 1.4, letterSpacing: '0.3px' }}>{pm.pct}%</div>
                <div style={{ width: 1, height: 4, background: `${pm.color}55` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Track lanes */}
        {elements.length === 0 ? (
          <div style={{ padding: '18px 14px', fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>
            Drag elements from the palette → they appear as lanes here
          </div>
        ) : elements.map(el => {
          const meta   = EL_TYPES[el.type] || { color: '#4F6EF7', icon: '⚡', label: el.type }
          const at     = el.timing?.in ?? 0
          const durn   = el.timing?.duration ?? 5
          const inPct  = (at / dur) * 100
          const durPct = clamp((durn / dur) * 100, 1, 100 - inPct)
          const isActive = currentTime >= at && currentTime <= at + durn
          const isSel  = el.id === selectedId
          const title  = el.props?.headline || el.props?.text || el.props?.question || meta.label
          return (
            <div
              key={el.id}
              style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--b1)', background: isSel ? 'rgba(79,110,247,0.05)' : 'var(--s2)' }}
            >
              {/* Track label */}
              <div
                onClick={() => onSelect(el.id)}
                style={{ width: 96, flexShrink: 0, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', borderRight: '1px solid var(--b1)' }}
              >
                <span style={{ fontSize: 13, flexShrink: 0 }}>{meta.icon}</span>
                <span style={{ fontSize: 10, fontWeight: isSel ? 700 : 500, color: isSel ? 'var(--t1)' : 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{title}</span>
              </div>
              {/* Lane area */}
              <div id={`tl-lane-${el.id}`} onClick={e => handleLaneClick(el, e)} style={{ flex: 1, position: 'relative', height: 32, cursor: 'crosshair' }}>
                {/* Grid lines */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {marks.slice(1).map(s => (
                    <div key={s} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(s / dur) * 100}%`, width: 1, background: 'rgba(255,255,255,0.04)' }} />
                  ))}
                  {/* Percentage guide lines */}
                  {PCT_MARKS.map(pm => (
                    <div key={pm.pct} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pm.pct}%`, width: 1, background: `${pm.color}22` }} />
                  ))}
                </div>
                {/* Clip */}
                <div
                  id={`tl-clip-${el.id}`}
                  onMouseDown={e => handleClipDrag(el, e)}
                  onClick={e => { e.stopPropagation(); onSelect(el.id) }}
                  style={{
                    position: 'absolute', top: 3, bottom: 3,
                    left:  `${inPct}%`,
                    width: `${Math.max(durPct, 1.5)}%`,
                    minWidth: 12,
                    background: isActive ? meta.color : `${meta.color}99`,
                    borderRadius: 5,
                    cursor: 'grab',
                    border: `1.5px solid ${isSel ? '#fff' : meta.color + 'cc'}`,
                    boxShadow: isSel ? '0 0 0 2px rgba(255,255,255,0.2)' : 'none',
                    display: 'flex', alignItems: 'center', padding: '0 5px',
                    overflow: 'hidden', userSelect: 'none', zIndex: 2,
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                    {meta.icon} {fmt(at)}
                  </span>
                  {/* Resize handle */}
                  <div
                    onMouseDown={e => { e.stopPropagation(); handleResizeDrag(el, e) }}
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}
                  >
                    <div style={{ width: 2, height: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 1, pointerEvents: 'none' }} />
                  </div>
                </div>
                {/* Current time playhead line */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct}%`, width: 2, background: 'rgba(79,110,247,0.8)', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 3 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main canvas export ─────────────────────────────────────────────────────────
export default function ElementCanvas({
  elements, selectedId, onSelect, onDeselect, onElementChange, onDelete,
  accentColor, video, showGrid, currentTime = 0, duration = 180, onSeek,
  playing, onTogglePlay,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' })
  const accent = accentColor || '#4F6EF7'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: 'var(--bg)', position: 'relative' }}>

      {/* ── Canvas area ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 10px 0px', background: 'var(--s3)' }}>
        <div
          ref={setNodeRef}
          data-el-canvas
          onClick={e => { if (e.currentTarget === e.target) onDeselect?.() }}
          style={{
            width: '100%', maxWidth: 960,
            aspectRatio: '16/9',
            maxHeight: 'calc(100vh - 240px)',            
            position: 'relative', 
            background: 'linear-gradient(135deg,#0e1428,#080f20)',
            borderRadius: 12, overflow: 'hidden',
            border: isOver ? `1px solid ${accent}` : '1px solid var(--b2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            cursor: 'default',
            transition: 'border-color 0.2s',
          }}
        >
          {/* Always-on subtle dot grid (HTML line 1648 — always present) */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }} />

          {/* Toggle line grid (HTML line 1677 — only when Grid button active) */}
          {showGrid && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '8.33% 11.1%',
              borderRadius: 12,
            }} />
          )}

          {/* Video background hint */}
          {(() => {
            const _v = video
            const thumb = _v?.branding?.thumbnailUrl
            if (thumb) return <img src={thumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, pointerEvents: 'none' }} />
            const _c = _v?.color || accent
            return (
              <>
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${_c}15 0%,${_c}08 50%,${_c}15 100%)`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${_c}22`, border: `2px solid ${_c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={`${_c}88`}><polygon points="8,5 19,12 8,19" /></svg>
                  </div>
                </div>
              </>
            )
          })()}

          {/* Timestamp badge */}
          <div style={{ position: 'absolute', top: 9, left: 9, background: 'rgba(0,0,0,0.55)', borderRadius: 5, padding: '3px 8px', fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', pointerEvents: 'none', zIndex: 20 }}>
            {fmt(currentTime)}
          </div>

          {/* Drop indicator */}
          {isOver && (
            <div style={{ position: 'absolute', inset: 0, border: `2px dashed ${accent}`, borderRadius: 12, background: `rgba(79,110,247,0.06)`, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99 }}>
              <div style={{ background: accent, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 22px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 24px rgba(79,110,247,0.4)` }}>
                📍 Drop to place on video
              </div>
            </div>
          )}

          {/* Empty state */}
          {elements.length === 0 && !isOver && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🎬</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(238,242,255,0.2)', marginBottom: 6 }}>No elements yet</div>
              <div style={{ fontSize: 12, color: 'rgba(123,135,160,0.25)', textAlign: 'center', lineHeight: 1.6 }}>
                Drag an element from the left panel<br />or double-click any element type to add it
              </div>
            </div>
          )}

          {/* Placed elements */}
          {elements.filter(el => {
            // Always show selected element for editing
            if (el.id === selectedId) return true
            
            // Check if element is within its timing window
            const timing = el.timing || {}
            // Use 'in' property which is what the timeline uses
            const startTime = timing.in ?? 0
            const duration = timing.duration ?? 5
            const endTime = startTime + duration
            
            // Show element only if current time is within its display window
            return currentTime >= startTime && currentTime < endTime
          }).map(el => (
            <CanvasElement
              key={el.id}
              el={el}
              selected={el.id === selectedId}
              onSelect={onSelect}
              onChange={onElementChange}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>

      {/* ── Timeline ── */}
      <Timeline
        elements={elements}
        duration={duration}
        currentTime={currentTime}
        onSeek={onSeek || (() => {})}
        onElementUpdate={onElementChange}
        selectedId={selectedId}
        onSelect={onSelect}
        playing={playing}
        onTogglePlay={onTogglePlay || (() => {})}
        accentColor={accent}
      />
    </div>
  )
}