'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { NOTIFICATIONS } from '@/lib/mockData'

const AppContext = createContext(null)

// ─── INITIAL STATE ────────────────────────────────────────────────────────────
// Matches the HTML's S object exactly (StreamAgent-v35.html lines 432-476)
const initialState = {

  // ── Auth ───────────────────────────────────────────────────────────────────
  isLoggedIn: false,
  authPage: 'login',        // 'login' | 'signup' | 'forgot'

  // ── Navigation ─────────────────────────────────────────────────────────────
  page: 'dashboard',        // current page id
  lightMode: false,
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  uploadInProgress: false,  // true while a video upload is in progress

  // ── Account ────────────────────────────────────────────────────────────────
  account: {
    firstName: 'Justin',
    lastName: 'D.',
    email: 'justin@techdrivenagent.com',
    company: 'Tech Driven Agent',
    phone: '(310) 555-1234',
    timezone: 'America/Los_Angeles',
    avatarUrl: '',
    twoFA: false,
  },
  profileOpen: false,

  // ── Notifications ──────────────────────────────────────────────────────────
  notifOpen: false,
  notifications: NOTIFICATIONS,
  notifEmail: true,
  notifSMS: false,
  notifPhone: '',
  notifEvents: { gate_convert: true, gate_skip: false, video_complete: true, branch: false },

  // ── Library ────────────────────────────────────────────────────────────────
  libView: 'grid',           // 'grid' | 'list'
  libFilter: 'all',          // 'all' | 'published' | 'draft'
  libSearch: '',
  libSelectedVideo: null,    // video id or null
  libFolder: null,           // folder id or null
  libNewFolderName: '',
  libDraggingVideo: null,    // video id being dragged

  // ── Video Workspace ────────────────────────────────────────────────────────
  videoDetailTab: 'overview', // 'overview'|'elements'|'branding'|'landing'|'settings'|'share'
  videoAITab: 'captions',     // 'captions' | 'chapters'
  shareModalVideo: null,      // video id for share modal

  // ── AI Features ────────────────────────────────────────────────────────────
  aiCaptions: [],
  aiChapters: [],
  aiCaptionStyle: 'hormozi',  // 'hormozi'|'classic'|'modern'|'minimal'
  aiHighlightColor: '#FFCC00',
  aiBarColor: '#000000',
  aiCaptionOpacity: 80,

  // ── Clone / Swap ───────────────────────────────────────────────────────────
  cloneSwapOpen: false,
  cloneSwapSource: null,
  cloneSwapTarget: null,

  // ── GIF Export ─────────────────────────────────────────────────────────────
  gifState: null,             // { startPct, endPct, fps, quality, gifWidth }

  // ── Elements Editor ────────────────────────────────────────────────────────
  elements: [],
  selEl: null,
  elCat: 'capture',           // 'capture'|'overlay'|'survey'|'mobile'
  elShowAllTypes: false,
  elPropTab: 'props',         // 'props'|'timing'|'conditions'|'gate'
  elDirty: false,
  elLastSaved: null,
  elUnsavedModal: false,
  elUnsavedTarget: null,
  elActiveVideoId: null,
  videoElements: {},          // { [videoId]: elements[] }
  elDropActive: false,
  elPlaying: false,
  elGridVisible: false,
  elProgress: 0,
  elDuration: 180,
  gatePreviewActive: null,
  surveySelections: {},
  behavSections: { start: true, playback: false, other: false },

  // ── Branding ───────────────────────────────────────────────────────────────
  brandingSub: 'play-button', // sub-tab within branding panel

  // ── Landing Page (global defaults) ────────────────────────────────────────
  lpVis: { logo: true, headline: true, body: true, cta: true, powered: true },
  lpFont: 'Outfit',
  lpBg: '#0F172A',
  lpTc: '#EEF2FF',
  lpBrandColor: '#4F6EF7',
  lpHeroUrl: '',
  lpHeroAlt: '',
  lpEditorRoute: null,

  // ── Upload ─────────────────────────────────────────────────────────────────
  uploadUploading: false,
  uploadProgress: 0,
  uploadDone: false,
  uploadAfterAction: 'library',

  // ── Analytics ──────────────────────────────────────────────────────────────
  analyticsTab: 'overview',   // 'overview'|'videos'|'routes'|'elements'|'leads'
  analyticsVideo: null,
  analyticsExpanded: false,
  analyticsSearch: '',
  analyticsSort: 'views',
  analyticsFolder: 'all',
  analyticsRange: '30d',

  // ── Route Builder ──────────────────────────────────────────────────────────
  routes: [],
  selRoute: null,
  editingRoute: null,
  routeElements: {},
  routeLandingPages: {},
  routeFolderOpen: false,
  routeSavedHash: '',
  streamRoutes: [],
  activeStreamRoute: null,
  builderVp: { x: 60, y: 40 },
  builderScale: 0.9,
  builderPreview: false,
  builderPreviewNode: null,
  builderPreviewHistory: [],
  builderEditingVideoId: null,
  builderSidebarOpen: false,
  builderLibExpanded: false,
  builderShareOpen: false,
  embedTab: 'js',

  // ── Settings ───────────────────────────────────────────────────────────────
  settingsTab: 'Account',
  settingsColor: '#4F6EF7',
  settingsAutoplay: false,
  settingsControls: true,
  settingsBranding: true,
  settingsCaptions: true,
  settingsChapters: true,
  settingsMobileFF: false,
  settingsComments: true,
  settingsFont: 'Outfit (Default)',
  settingsLogoUrl: '',
  settingsThumbnail: 0,
  settingsCtaColor: '#4F6EF7',

  // ── Integrations ───────────────────────────────────────────────────────────
  integrationsSubTab: 'pixels',

  // ── Pixels / Tracking ──────────────────────────────────────────────────────
  metaPixelId: '',
  tiktokPixelId: '',
  googleAdsId: '',
  metaCAPIDatasetId: '',
  metaCAPIToken: '',
  linkedinPartnerId: '',
  pixelLeadValue: '',
  pixelCPTracking: true,
  pixelEnhancedConv: false,
  cv_watch25: '1',
  cv_watch50: '5',
  cv_watch75: '15',
  cv_watch95: '25',
  cv_lead: '20',
  cv_lead_high: '50',

  // ── Email Integrations ─────────────────────────────────────────────────────
  sendgridKey: '',
  mailchimpKey: '',
  activecampaignKey: '',
  activecampaignUrl: '',
  convertkitKey: '',
  constantcontactKey: '',
  mailchimpOAuth: null,
  activecampaignOAuth: null,
  klaviyoOAuth: null,
  constantContactOAuth: null,

  // ── CRM Integrations ───────────────────────────────────────────────────────
  hubspotKey: '',
  salesforceKey: '',
  lionDeskKey: '',
  kvcoreApiKey: '',
  fubOAuth: null,
  hubspotOAuth: null,
  salesforceOAuth: null,
  ghlOAuth: null,

  // ── Video Import ───────────────────────────────────────────────────────────
  vimeoOAuth: null,
  wistiaOAuth: null,
  wistiaApiKey: '',
  clickfunnelsOAuth: null,
  importingFrom: null,
  importVideos: [],
  importSelected: [],

  // ── Lead Routing ───────────────────────────────────────────────────────────
  leadRouting: {
    destinations: ['crm'],
    mailchimpList: '',
    hubspotPipeline: '',
    acList: '',
    ckFormId: '',
  },

  // ── Leads CRM ──────────────────────────────────────────────────────────────
  leadsFilter: 'all',
  leadsSearch: '',
  leadsSort: 'newest',
  selectedLead: null,
  leadsSelected: [],          // array of selected lead ids
  leadsSelectAll: false,
  leadsBulkMenu: false,

  // ── QR ─────────────────────────────────────────────────────────────────────
  qrVideo: 1,

  // ── Goals (Dashboard) ──────────────────────────────────────────────────────
  dashGoals: [
    { id: 'g1', type: 'leads',      label: 'Leads Captured', target: 500,   current: 212,  period: 'month', icon: '⚡', color: '#1ED8A0' },
    { id: 'g2', type: 'views',      label: 'Video Views',    target: 10000, current: 6847, period: 'month', icon: '👁', color: '#4F6EF7' },
    { id: 'g3', type: 'completion', label: 'Avg Watch Depth',target: 70,    current: 58,   period: 'month', icon: '🎯', color: '#F5A623', unit: '%' },
  ],
  dashGoalModal: false,

  // ── Captions (global settings) ─────────────────────────────────────────────
  captionsEnabled: true,
  captionsLang: 'en',
  chaptersEnabled: true,

  // ── Global Search ──────────────────────────────────────────────────────────
  globalSearch: '',
}

// ─── PROVIDER ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, setState] = useState(initialState)

  // Generic set — accepts object or updater function
  const set = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      ...(typeof updates === 'function' ? updates(prev) : updates),
    }))
  }, [])

  // Navigate to a page
  const goto = useCallback((page) => {
    setState(prev => ({
      ...prev,
      page,
      profileOpen: false,
      notifOpen: false,
      // Clear video selection so coming back to /library shows the grid, not a stale video
      libSelectedVideo: null,
      videoDetailTab: 'overview',
    }))
  }, [])

  // Log in
  const login = useCallback((userData) => {
    setState(prev => ({
      ...prev,
      isLoggedIn: true,
      page: 'dashboard',
      account: userData ? {
        ...prev.account,
        firstName: userData.firstName || prev.account.firstName,
        lastName: userData.lastName || prev.account.lastName,
        email: userData.email || prev.account.email,
      } : prev.account,
    }))
  }, [])

  // Log out
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    setState(prev => ({
      ...prev,
      isLoggedIn: false,
      authPage: 'login',
      page: 'dashboard',
      profileOpen: false,
    }))
    if (typeof window !== 'undefined') {
      window.location.replace('/login')
    }
  }, [])

  // Update a single video's data (branding, lp, elements, etc.)
  const updateVideo = useCallback((videoId, updates) => {
    setState(prev => {
      // videos live in mockData — for now we store overrides in state
      const overrides = { ...(prev.videoOverrides || {}), [videoId]: { ...(prev.videoOverrides?.[videoId] || {}), ...updates } }
      return { ...prev, videoOverrides: overrides }
    })
  }, [])

  const value = { state, set, goto, login, logout, updateVideo }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}