/**
 * Builds a lightweight visitor fingerprint from browser properties.
 * No external library — pure browser APIs.
 * Returns a short alphanumeric string e.g. "1k3m9xz"
 */
export function buildFingerprint() {
    if (typeof window === 'undefined') return null
    try {
        const raw = [
            navigator.userAgent,
            `${screen.width}x${screen.height}`,
            String(new Date().getTimezoneOffset()),
            navigator.language || '',
            String(screen.colorDepth || ''),
        ].join('|')

        let hash = 0
        for (let i = 0; i < raw.length; i++) {
            hash = Math.imul(31, hash) + raw.charCodeAt(i) | 0
        }
        return Math.abs(hash).toString(36)
    } catch {
        return null
    }
}