/**
 * localStorage helpers for gate completion memory.
 * Key format: gate__{element_id}
 */
const PREFIX = 'gate__'

export function isGateCompleted(elementId) {
    if (typeof window === 'undefined') return false
    try {
        return localStorage.getItem(`${PREFIX}${elementId}`) === 'done'
    } catch {
        return false
    }
}

export function markGateCompleted(elementId) {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(`${PREFIX}${elementId}`, 'done')
    } catch { }
}

export function clearGate(elementId) {
    if (typeof window === 'undefined') return
    try {
        localStorage.removeItem(`${PREFIX}${elementId}`)
    } catch { }
}