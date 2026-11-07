// Trip builder helpers. Pure functions, no browser APIs. Distances are straight-line (haversine) only, never driving.
import type { ListedStop } from './stops'

const EARTH_MI = 3958.8

type Point = { lat: number | null; lng: number | null }
export const hasCoords = <T extends Point>(d: T): d is T & { lat: number; lng: number } => d.lat !== null && d.lng !== null

export function haversineMi(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_MI * Math.asin(Math.min(1, Math.sqrt(h)))
}

// One decimal under 10 miles (two stores in one city), whole miles above.
export function formatMi(mi: number): string {
  return mi < 10 ? mi.toFixed(1) : Math.round(mi).toLocaleString('en-US')
}

// ?trip=id1,id2: known ids only, first occurrence wins, order kept. `ignored` counts what was dropped.
export function parseTrip(raw: string | null, known: ReadonlySet<string>): { ids: string[]; ignored: number } {
  if (!raw) return { ids: [], ignored: 0 }
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
  const ids: string[] = []
  for (const p of parts) if (known.has(p) && !ids.includes(p)) ids.push(p)
  return { ids, ignored: parts.length - ids.length }
}

// Nearest neighbour: start at `startId` (or the first stop with coordinates), then always go to the closest stop not
// yet visited; a tie goes to the stop added first. Stops without coordinates can't be placed, so they follow in the
// order they were added.
export function suggestOrder(stops: ListedStop[], startId?: string): string[] {
  const mapped = stops.filter(hasCoords)
  const unmapped = stops.filter((d) => !hasCoords(d))
  if (mapped.length === 0) return stops.map((d) => d.id)
  let current = mapped.find((d) => d.id === startId) ?? mapped[0]
  const rest = mapped.filter((d) => d !== current)
  const out = [current]
  while (rest.length) {
    let best = 0
    let bestMi = Infinity
    rest.forEach((d, i) => {
      const mi = haversineMi(current, d)
      if (mi < bestMi) {
        bestMi = mi
        best = i
      }
    })
    current = rest.splice(best, 1)[0]
    out.push(current)
  }
  return [...out, ...unmapped].map((d) => d.id)
}

// The distance of each leg (stop i to stop i + 1), or null when either end has no coordinates.
export function legMiles(stops: ListedStop[]): (number | null)[] {
  const legs: (number | null)[] = []
  for (let i = 0; i + 1 < stops.length; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    legs.push(hasCoords(a) && hasCoords(b) ? haversineMi(a, b) : null)
  }
  return legs
}

// Real directions open in the visitor's own maps app, built from the store addresses.
export const legDirectionsUrl = (from: string, to: string): string =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`
