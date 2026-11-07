import { MAP, type Stop } from '../data/types'

// Everything here derives from src/data/map.json and the stops, so nothing about the stores is hard-coded in the UI.
export const SEO_TITLE = MAP.seoTitle ?? MAP.title
export const SEO_DESCRIPTION = MAP.seoDescription ?? MAP.kicker

// The deployed address, set per environment. Without it there is no canonical URL and the sitemap is empty.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '') || null

// Prototype phase: search engines are asked to stay away (robots meta noindex, robots.txt disallow, empty sitemap)
// unless the build sets NEXT_PUBLIC_INDEXABLE=true.
export const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE?.trim() === 'true'

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function latestVerified(stops: Stop[]): string | null {
  const dates = stops.map((d) => d.verifiedOn).filter((v): v is string => v !== null)
  return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null
}

// "16 stores in 10 states and DC". Counted from the data; DC is not a state.
export function storeStats(stops: Stop[]): string {
  const states = new Set(stops.map((d) => d.state))
  const hasDc = states.delete('DC')
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
  const where = [states.size > 0 ? count(states.size, 'state', 'states') : null, hasDc ? 'DC' : null].filter(Boolean).join(' and ')
  return `${count(stops.length, 'store', 'stores')}${where ? ` in ${where}` : ''}`
}

// schema.org ItemList of the non-closed stops, with only fields recorded as verified. Safe to put inside a <script>:
// "<" can't close the tag once escaped.
export function homeJsonLd(stops: Stop[]): string {
  const verified = stops.filter((d) => d.status !== 'closed' && d.verifiedOn !== null)
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: SEO_TITLE,
    itemListElement: verified.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Store',
        name: d.name,
        ...(d.address ? { address: d.address } : {}),
        ...(d.website ? { url: d.website } : {}),
        ...(d.phone ? { telephone: d.phone } : {}),
      },
    })),
  }
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
