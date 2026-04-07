import useSWR from 'swr'

const fetcher = (url) => fetch(url).then(r => r.json())

// ── Coordinate conversion helpers ─────────────────────────────────────────────
// Your canvas uses percentage positions (xPct, yPct, wPct, hPct: 0-100)
// Your DB stores integer pixel-equivalent values (x, y, w, h: 0-100 stored as INT)
// We treat them as the same — store the percentage value as INT in DB

export function dbToCanvas(el) {
  // Convert DB row → canvas element shape
  return {
    ...el,
    // Map DB integer columns to canvas percentage fields
    xPct: el.x   ?? 10,
    yPct: el.y   ?? 10,
    wPct: el.w   ?? 40,
    hPct: el.h   ?? 25,
    // Normalize timing — DB shape: { in, duration, animIn, animOut, animSpeed }
    timing: el.timing ? {
      in:        el.timing.in        ?? 0,
      duration:  el.timing.duration  ?? 5,
      animIn:    el.timing.animIn    ?? 'fadeIn',
      animOut:   el.timing.animOut   ?? 'fadeOut',
      animSpeed: el.timing.animSpeed ?? '0.4',
      trigger:   el.timing.trigger   ?? 'time',
      triggerValue: el.timing.triggerValue ?? null,
      mode:      el.timing.mode      ?? 'at-time',
    } : {
      in: 0, duration: 5, animIn: 'fadeIn', animOut: 'fadeOut',
      animSpeed: '0.4', trigger: 'time', mode: 'at-time',
    },
    // Normalize conditions
    conditions: Array.isArray(el.conditions) ? el.conditions : [],
    // Normalize gate
    gate: el.gate || {},
    // Normalize opacity and zIndex
    opacity: el.opacity ?? 1,
    zIndex:  el.z_index ?? 1,
  }
}

export function canvasToDb(el) {
  // Convert canvas element shape → DB columns
  return {
    type:         el.type,
    x:            Math.round(el.xPct ?? el.x ?? 10),
    y:            Math.round(el.yPct ?? el.y ?? 10),
    w:            Math.round(el.wPct ?? el.w ?? 40),
    h:            Math.round(el.hPct ?? el.h ?? 25),
    z_index:      el.zIndex  ?? el.z_index ?? 1,
    opacity:      el.opacity ?? 1,
    props:        el.props   ?? {},
    timing: {
      in:          el.timing?.in        ?? 0,
      duration:    el.timing?.duration  ?? 5,
      animIn:      el.timing?.animIn    ?? 'fadeIn',
      animOut:     el.timing?.animOut   ?? 'fadeOut',
      animSpeed:   el.timing?.animSpeed ?? '0.4',
      trigger:     el.timing?.trigger   ?? 'time',
      triggerValue: el.timing?.triggerValue ?? null,
      mode:        el.timing?.mode      ?? 'at-time',
    },
    conditions:   Array.isArray(el.conditions) ? el.conditions : [],
    gate:         el.gate         ?? null,
    lead_routing: el.lead_routing ?? {},
    route_id:     el.route_id     ?? null,
    sort_order:   el.sort_order   ?? 0,
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useElements(videoId) {
  const { data, error, isLoading, mutate } = useSWR(
    videoId ? `/api/videos/${videoId}/elements` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Raw DB elements converted to canvas shape
  const elements = (data?.elements ?? []).map(dbToCanvas)

  // ── Create a new element ───────────────────────────────────────────────────
  async function createElement(canvasEl) {
    const body = canvasToDb(canvasEl)

    const res = await fetch(`/api/videos/${videoId}/elements`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to create element')

    // Refresh list
    mutate()
    // Return the new element in canvas shape (has real DB id now)
    return dbToCanvas(json.element)
  }

  // ── Update a single element ────────────────────────────────────────────────
  async function updateElement(elementId, canvasEl) {
    const body = canvasToDb(canvasEl)

    const res = await fetch(`/api/elements/${elementId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to update element')

    mutate()
    return dbToCanvas(json.element)
  }

  // ── Delete a single element ────────────────────────────────────────────────
  async function deleteElement(elementId) {
    const res = await fetch(`/api/elements/${elementId}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to delete element')

    mutate()
    return true
  }

  // ── Bulk save multiple elements (after drag reorder) ──────────────────────
  async function bulkSaveElements(canvasEls) {
    const elements = canvasEls.map((el, i) => ({
      id:         el.id,
      x:          Math.round(el.xPct ?? el.x ?? 10),
      y:          Math.round(el.yPct ?? el.y ?? 10),
      w:          Math.round(el.wPct ?? el.w ?? 40),
      h:          Math.round(el.hPct ?? el.h ?? 25),
      sort_order: el.sort_order ?? i,
    }))

    const res = await fetch(`/api/videos/${videoId}/elements/bulk`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ elements }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to bulk save elements')

    mutate()
    return json.elements
  }

  return {
    elements,
    isLoading,
    isError:           !!error,
    createElement,
    updateElement,
    deleteElement,
    bulkSaveElements,
    refresh:           mutate,
  }
}