// ── Element type definitions (mirrors HTML EL_TYPES) ─────────────────────────
export const EL_TYPES = {
  'cta-email': { cat: 'capture', label: 'Lead Capture', icon: '✉️', color: '#4F6EF7', desc: 'Collect emails mid-video', defs: { collectName: true, collectPhone: true, headline: 'Get the free playbook', sub: "Drop your email and we'll send it instantly", buttonText: 'Send Me the Playbook', buttonColor: '#4F6EF7' } },
  'cta-booking': { cat: 'capture', label: 'Book a Call', icon: '📅', color: '#A855F7', desc: 'Calendar booking', defs: { collectName: true, collectPhone: true, headline: 'Book a free strategy call', sub: '30 minutes. No pitch.', buttonText: 'Reserve My Spot', buttonColor: '#A855F7', calUrl: '' } },
  'cta-download': { cat: 'capture', label: 'Download', icon: '⬇️', color: '#F5A623', desc: 'Offer a file download', defs: { collectName: true, collectPhone: true, headline: 'Download the free playbook', buttonText: 'Download Now', buttonColor: '#F5A623', fileUrl: '' } },
  'funnel-urgency': { cat: 'capture', label: 'Lead Gate + Urgency', icon: '🔥', color: '#FF6B6B', desc: 'Full-screen capture with limited spots badge', defs: { headline: 'Want to Continue Watching?', subheadline: 'Enter Your Details Below', collectName: true, collectEmail: true, collectPhone: true, buttonText: 'Continue Watching →', buttonColor: '#FF6B6B', urgencyText: 'Only 3 spots left at this price', urgencyType: 'spots', spotsLeft: 3 } },
  'cta-button': { cat: 'overlay', label: 'Click Button', icon: '👆', color: '#1ED8A0', desc: 'Link to any URL', defs: { text: 'Learn More →', buttonColor: '#1ED8A0', url: '' } },
  'overlay-text': { cat: 'overlay', label: 'Text Overlay', icon: 'T', color: '#EEF2FF', desc: 'Animated text on video', defs: { text: 'Your compelling headline here', fontSize: 20, color: '#EEF2FF', background: 'rgba(0,0,0,0.5)', align: 'center' } },
  'overlay-countdown': { cat: 'overlay', label: 'Countdown Timer', icon: '⏱', color: '#F5A623', desc: 'Urgency countdown', defs: { label: 'Offer ends in', minutes: 10, seconds: 0, color: '#F5A623' } },
  'overlay-chapter': { cat: 'overlay', label: 'Chapter Title', icon: '📖', color: '#1ED8A0', desc: 'Section title card', defs: { chapter: 'Chapter 1', title: 'Introduction', color: '#1ED8A0' } },
  'share-social': { cat: 'overlay', label: 'Social Share', icon: '🔗', color: '#F06292', desc: 'Share buttons overlay', defs: { label: 'Share this video', color: '#F06292', layout: 'horizontal' } },
  'sticky-bar': { cat: 'overlay', label: 'Sticky CTA Bar', icon: '📌', color: '#FF6B6B', desc: 'Persistent top/bottom bar', defs: { text: '🔥 Limited spots — Book your free call', buttonText: 'Book Now →', buttonColor: '#FF6B6B', url: '', position: 'bottom' } },
  'annotation-link': { cat: 'overlay', label: 'Annotation Card', icon: '🔗', color: '#A855F7', desc: 'Corner pop-in link card', defs: { title: 'Watch Next', sub: 'Advanced Strategy Session', url: '', thumbnailEmoji: '🎬', color: '#A855F7', position: 'bottom-right' } },
  'image-clickable': { cat: 'overlay', label: 'Clickable Image', icon: '🖼️', color: '#06B6D4', desc: 'Image overlay with link', defs: { imageUrl: '', url: '', openNewTab: true, borderRadius: 8, opacity: 1, altText: '' } },
  'choice-point': { cat: 'overlay', label: 'Choice Point', icon: '🔀', color: '#4F6EF7', desc: 'Branch viewer to different videos', defs: { question: 'What would you like to do next?', choices: [{ id: 'c1', text: 'Option 1', color: '#4F6EF7' }, { id: 'c2', text: 'Option 2', color: '#A855F7' }, { id: 'c3', text: 'Option 3', color: '#1ED8A0' }], layout: 'grid', buttonColor: '#4F6EF7', allowSkip: false } },
  'survey-poll': { cat: 'survey', label: 'Poll / Survey', icon: '📊', color: '#A855F7', desc: 'Single question poll', defs: { collectName: true, collectPhone: true, question: 'What matters most to you?', options: ['More leads', 'Better conversions', 'Build my brand', 'Save time'], buttonText: 'Submit Answer', buttonColor: '#A855F7', showResults: true } },
  'survey-rating': { cat: 'survey', label: 'Star Rating', icon: '⭐', color: '#F5A623', desc: '1–5 star rating widget', defs: { collectName: true, collectPhone: true, question: 'How valuable was this information?', stars: 5, buttonText: 'Submit Rating', buttonColor: '#F5A623' } },
  'survey-nps': { cat: 'survey', label: 'NPS Score', icon: '📈', color: '#06B6D4', desc: 'Net Promoter Score 0–10', defs: { collectName: true, collectPhone: true, question: 'How likely are you to recommend us?', lowLabel: 'Not likely', highLabel: 'Very likely', buttonColor: '#06B6D4', buttonText: 'Submit' } },
  'mob-call': { cat: 'mobile', label: 'Tap to Call', icon: '📞', color: '#1ED8A0', desc: 'One-tap phone call button', defs: { phone: '', label: 'Call Now', subtitle: 'Tap to connect instantly', bgColor: '#1ED8A0' } },
  'mob-sms': { cat: 'mobile', label: 'Tap to Text', icon: '💬', color: '#4F6EF7', desc: 'Pre-filled SMS message', defs: { phone: '', message: "Hi! I just watched your video and I'm interested.", label: 'Text Us', bgColor: '#4F6EF7' } },
  'mob-vcard': { cat: 'mobile', label: 'Save Contact', icon: '👤', color: '#A855F7', desc: 'Download vCard to phone contacts', defs: { name: '', phone: '', email: '', company: '', title: '', label: 'Save My Contact', bgColor: '#A855F7' } },
  'mob-calendar': { cat: 'mobile', label: 'Add to Calendar', icon: '📅', color: '#F5A623', desc: 'Add event to phone calendar', defs: { eventTitle: '', eventDate: '', eventTime: '', label: 'Add to Calendar', bgColor: '#F5A623' } },
  'mob-swipe': { cat: 'mobile', label: 'Swipe Up CTA', icon: '👆', color: '#FF6B6B', desc: 'Instagram-style swipe up prompt', defs: { label: 'Swipe Up to Learn More', url: '', bgColor: '#FF6B6B' } },
  'mob-share': { cat: 'mobile', label: 'Share via Text', icon: '📤', color: '#06B6D4', desc: 'Pre-filled SMS share link', defs: { message: 'Check out this video:', label: 'Share with a Friend', bgColor: '#06B6D4' } },
  'mob-directions': { cat: 'mobile', label: 'Get Directions', icon: '📍', color: '#FF6B35', desc: 'Opens Maps to an address', defs: { address: '', label: 'Get Directions', subtitle: 'Open in Maps', bgColor: '#FF6B35' } },
  'mob-screenshot': { cat: 'mobile', label: 'Screenshot CTA', icon: '📸', color: '#F06292', desc: 'Styled card designed to be screenshotted', defs: { headline: 'Save This Info', line1: '', line2: '', phone: '', bgColor: '#0F172A', accentColor: '#F06292' } },
  'mob-shake': { cat: 'mobile', label: 'Shake to Reveal', icon: '🫨', color: '#FFD700', desc: 'Shake phone to reveal hidden offer', defs: { hiddenText: 'Use code SAVE20 for 20% off!', promptText: 'Shake your phone for a surprise!', bgColor: '#FFD700', revealBg: '#1ED8A0' } },
}

export const EL_CATS = [
  { id: 'capture', label: 'Lead Capture', icon: '⚡', color: '#4F6EF7' },
  { id: 'overlay', label: 'Overlays', icon: '🎨', color: '#F5A623' },
  { id: 'survey', label: 'Polls', icon: '📊', color: '#A855F7' },
  { id: 'mobile', label: 'Mobile Exclusive', icon: '📱', color: '#1ED8A0' },
]

export function getTypesByCategory(catId) {
  return Object.entries(EL_TYPES).filter(([, def]) => def.cat === catId)
}