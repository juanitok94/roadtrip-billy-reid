// Shared class names and small helpers for the list and the trip panel.
import type { ListedStop } from '@/lib/stops'

export const OUTLINE_BUTTON =
  'inline-flex min-h-11 items-center border border-ink px-4 text-sm text-ink transition-colors hover:bg-ink hover:text-page'
export const LABEL = 'inline-block border border-hairline px-1.5 py-0.5 text-[11px] leading-tight text-ink-soft'
export const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>
export const HOURS_DISCLAIMER = "Hours change; check the store's page before you go."

export const placeLabel = (d: ListedStop) => (d.city ? `${d.city}, ${d.state}` : 'Location not yet verified')
export const street = (d: ListedStop) => d.address?.split(',')[0] ?? null

// A short spoken name for buttons ("Move Atlanta up"). Two stores in one city also get their street.
export const shortName = (d: ListedStop, shared: boolean) => {
  const city = d.city ?? d.name
  const s = shared ? street(d) : null
  return s ? `${city}, ${s}` : city
}
