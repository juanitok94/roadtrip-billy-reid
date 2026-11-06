// The stops visitors see. Closed stops stay in src/data/stops.json for history (check:data still validates them) but
// are never shown: no pin, row, filter option, count or structured data. Every page reads stops here.
import stops from '../data/stops.json'
import type { Stop } from '../data/types'

// `number` is the stop's place in the full list. It stays the same whatever is filtered, so a pin's number always
// finds the same row.
export type ListedStop = Stop & { number: number }

const byCity = (a: Stop, b: Stop) =>
  (a.city ?? '').localeCompare(b.city ?? '', 'en', { sensitivity: 'base' }) ||
  (a.address ?? '').localeCompare(b.address ?? '', 'en', { sensitivity: 'base' }) ||
  a.id.localeCompare(b.id)

export const VISITOR_STOPS: ListedStop[] = (stops as Stop[])
  .filter((d) => d.status !== 'closed')
  .sort(byCity)
  .map((d, i) => ({ ...d, number: i + 1 }))

export const padNumber = (n: number): string => String(n).padStart(2, '0')
