/**
 * Returns true if the current device is a mobile device.
 * Uses both touch points AND viewport width (matches Day 7 spec exactly).
 */
export function isMobileDevice() {
    if (typeof window === 'undefined') return false
    return navigator.maxTouchPoints > 0 && window.innerWidth < 768
}

/**
 * Evaluates element conditions array.
 * Supported condition types: 'device'
 * Returns true if element should be shown.
 */
export function shouldShowElement(el) {
    const conds = el.conditions || []
    if (!conds.length) return true

    return conds.every(c => {
        if (c.type === 'device') {
            const vals = c.value.split(',').map(v => v.trim())
            const mobile = isMobileDevice()
            if (vals.includes('mobile') && !vals.includes('desktop')) return mobile
            if (vals.includes('desktop') && !vals.includes('mobile')) return !mobile
        }
        return true
    })
}