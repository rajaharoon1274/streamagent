/**
 * Viewer Identity — first-party cookie + personalized link token
 *
 * Cookie name : sa_viewer_email
 * Cookie TTL  : 365 days
 * lid param   : /watch/[id]?lid=[lead_id_hash]
 */

const COOKIE_NAME = 'sa_viewer_email'
const COOKIE_DAYS = 365

// ── Cookie helpers ────────────────────────────────────────────────────────────
export function setViewerEmailCookie(email) {
    if (typeof document === 'undefined') return
    const expires = new Date()
    expires.setDate(expires.getDate() + COOKIE_DAYS)
    // SameSite=Lax so it works cross-page but not cross-site
    document.cookie = [
        `${COOKIE_NAME}=${encodeURIComponent(email)}`,
        `expires=${expires.toUTCString()}`,
        'path=/',
        'SameSite=Lax',
    ].join('; ')
}

export function getViewerEmailCookie() {
    if (typeof document === 'undefined') return null
    const match = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${COOKIE_NAME}=`))
    if (!match) return null
    try {
        return decodeURIComponent(match.split('=')[1])
    } catch {
        return null
    }
}

export function clearViewerEmailCookie() {
    if (typeof document === 'undefined') return
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

// ── ?lid= token helpers ───────────────────────────────────────────────────────
export function getLidFromUrl() {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get('lid') || null
}

/**
 * Returns the best available viewer identity:
 * Priority: ?lid= param > email cookie > fingerprint only
 */
export function resolveViewerIdentity() {
    return {
        lid: getLidFromUrl(),
        email: getViewerEmailCookie(),
    }
}