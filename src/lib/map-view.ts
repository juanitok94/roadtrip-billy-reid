// Zoomable map views. The SVG is drawn in screen pixels: the country zooms by changing a nested viewBox, while pins
// and labels keep their on-screen size at every zoom. Pure functions, no browser APIs.
export type Rect = { x: number; y: number; w: number; h: number }

export const TARGET_PX = 44 // every pin's target
export const PIN_PX = 26 // a pin's drawn width, used to keep pins from covering each other's numbers
export const LABEL_PX = 10 // region labels
export const CHAR_W = 6 // IBM Plex Mono is 0.6em wide
const MIN_VIEW_W = 300 // never zoom tighter than this many map units
const VIEW_PAD = 1.2 // room around a region's states when zoomed to it
// A 320px screen has a 288px column; the map's 1px frame leaves 286px. A region's target is 44px wide at that size.
const SMALLEST_MAP_PX = 286

export const minTarget = (mapW: number): number => Math.ceil((TARGET_PX * mapW) / SMALLEST_MAP_PX)

export type Work = { id: string; x0: number; y0: number; x: number; y: number }

// Simple relaxation: push overlapping points apart, with a limit on how far one may leave its true spot.
export function relax(items: Work[], gap: number, maxPull: number): void {
  for (let iter = 0; iter < 200; iter++) {
    let moved = false
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]
        const b = items[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.hypot(dx, dy)
        if (dist >= gap) continue
        if (dist < 0.01) {
          // identical spots: separate along a fixed, deterministic direction
          const ang = ((i * 7 + j * 3) % 12) * (Math.PI / 6)
          dx = Math.cos(ang)
          dy = Math.sin(ang)
          dist = 1
        }
        const push = (gap - dist) / 2
        const ux = dx / dist
        const uy = dy / dist
        a.x -= ux * push
        a.y -= uy * push
        b.x += ux * push
        b.y += uy * push
        moved = true
      }
    }
    for (const p of items) {
      const dx = p.x - p.x0
      const dy = p.y - p.y0
      const d = Math.hypot(dx, dy)
      if (d > maxPull) {
        p.x = p.x0 + (dx / d) * maxPull
        p.y = p.y0 + (dy / d) * maxPull
      }
    }
    if (!moved) break
  }
}

// The view that shows an area with a little room around it, at the whole map's aspect so a map unit is square on screen.
export function fitView(area: Rect, whole: Rect): Rect {
  const aspect = whole.w / whole.h
  let w = Math.max(area.w * VIEW_PAD, MIN_VIEW_W)
  let h = w / aspect
  if (h < area.h * VIEW_PAD) {
    h = area.h * VIEW_PAD
    w = h * aspect
  }
  if (w >= whole.w) return whole
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi))
  return {
    x: clamp(area.x + area.w / 2 - w / 2, whole.x, whole.x + whole.w - w),
    y: clamp(area.y + area.h / 2 - h / 2, whole.y, whole.y + whole.h - h),
    w,
    h,
  }
}

export function lerpView(a: Rect, b: Rect, t: number): Rect {
  const at = (p: number, q: number) => p + (q - p) * t
  return { x: at(a.x, b.x), y: at(a.y, b.y), w: at(a.w, b.w), h: at(a.h, b.h) }
}

// Map units to drawing pixels for one view.
export function toPx(pxW: number, view: Rect, x: number, y: number): { x: number; y: number } {
  const k = pxW / view.w
  return { x: (x - view.x) * k, y: (y - view.y) * k }
}

// Where each pin sits in pixels: its true spot, nudged only as far as it takes for pins to keep `gap` between centres
// and stay inside the drawing. A nudged pin gets a leader back to its true spot.
export function placePins(
  pins: { id: string; x: number; y: number }[],
  gap: number,
  pxW: number,
  pxH: number,
): Map<string, Work> {
  const items: Work[] = pins.map((p) => ({ id: p.id, x0: p.x, y0: p.y, x: p.x, y: p.y }))
  const inset = gap / 2
  const clamp = () => {
    for (const p of items) {
      p.x = Math.max(inset, Math.min(p.x, pxW - inset))
      p.y = Math.max(inset, Math.min(p.y, pxH - inset))
    }
  }
  // Pulled in from an edge, a pin can land on a neighbour, so spacing and clamping take turns until they agree.
  for (let round = 0; round < 8; round++) {
    relax(items, gap, gap * 3)
    clamp()
  }
  return new Map(items.map((p) => [p.id, p]))
}
