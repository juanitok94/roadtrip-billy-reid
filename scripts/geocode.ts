// Fill lat/lng for stops that have a verified address but no coordinates, using OpenStreetMap Nominatim.
//
//   npm run geocode            query Nominatim and write accepted results to src/data/stops.json
//   npm run geocode -- --dry   query and report only
//
// Rules (CLAUDE.md, "Never guess"):
// - Only stops with an address AND verifiedOn AND null lat/lng are queried.
// - A result is accepted only if it is in the stop's state and its OSM place matches the stop's city, and it is not a
//   bare road. The full address is tried first, then once more without a suite or unit. Otherwise: "needs manual check".
// - Nominatim usage policy: identifying User-Agent, at most 1 request per second (we wait 1.1 s).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Stop } from '../src/data/types'
import { STATE_NAMES } from '../src/lib/states'

const UA = 'map-guides (Peachy Kean DevOps)'
const SOURCE = 'OpenStreetMap Nominatim'
const GAP_MS = 1100

const stopsPath = join(process.cwd(), 'src/data/stops.json')

type Hit = {
  lat: string
  lon: string
  display_name: string
  category?: string
  address?: Record<string, string>
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
let last = 0
async function search(params: Record<string, string>): Promise<Hit[]> {
  const wait = last + GAP_MS - Date.now()
  if (wait > 0) await sleep(wait)
  last = Date.now()
  const qs = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', limit: '5', countrycodes: 'us', ...params })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  return (await res.json()) as Hit[]
}

// OSM often writes New York as "City of New York".
const norm = (s: string) => s.toLowerCase().replace(/^city of /, '').replace(/[^a-z]/g, '')
const PLACE_KEYS = ['city', 'town', 'village', 'hamlet', 'municipality', 'suburb']

function check(stop: Stop, h: Hit): string | null {
  // A bare road match is only the road's midpoint, which can be kilometres from the stop. Never accept it.
  if (h.category === 'highway') return 'road-level match only'
  const a = h.address ?? {}
  // OSM has no state on a DC result; its city is the place's own name, checked below.
  const state = a.state ?? (stop.state === 'DC' ? STATE_NAMES.DC : undefined)
  if (state !== STATE_NAMES[stop.state]) return `state is ${a.state ?? 'missing'}`
  const places = PLACE_KEYS.map((k) => a[k]).filter(Boolean)
  if (!stop.city || !places.some((p) => norm(p) === norm(stop.city!))) return `city ${places.join('/') || 'missing'} != ${stop.city}`
  return null
}

// "1200 Villa Place, Suite 403, Nashville, TN 37212" without "Suite 403".
const dropUnit = (address: string) =>
  address
    .split(',')
    .map((s) => s.trim())
    .filter((part) => !/^(suite|ste\.?|unit|#)\s*\S+$/i.test(part))
    .join(', ')

async function geocode(stop: Stop): Promise<{ lat: number; lng: number; via: string } | { reason: string }> {
  const address = stop.address!
  const simplified = dropUnit(address)
  const attempts: [string, string][] = [['full address', address]]
  if (simplified !== address) attempts.push(['without suite or unit', simplified])
  const reasons: string[] = []
  for (const [label, q] of attempts) {
    const hits = await search({ q })
    if (!hits.length) {
      reasons.push(`${label}: no result`)
      continue
    }
    for (const h of hits) {
      const why = check(stop, h)
      if (!why) return { lat: Number(Number(h.lat).toFixed(5)), lng: Number(Number(h.lon).toFixed(5)), via: `${label}: ${h.display_name}` }
      reasons.push(`${label}: rejected ${h.display_name} (${why})`)
    }
  }
  return { reason: reasons.join('; ') }
}

async function main() {
  const dry = process.argv.includes('--dry')
  const stops = JSON.parse(readFileSync(stopsPath, 'utf8')) as Stop[]
  const filled: string[] = []
  const manual: string[] = []

  for (const s of stops) {
    if (s.lat !== null && s.lng !== null) continue
    if (!s.address || !s.verifiedOn) continue
    const r = await geocode(s)
    if ('reason' in r) {
      manual.push(`${s.id}: ${r.reason}`)
      continue
    }
    s.lat = r.lat
    s.lng = r.lng
    s.geocodeSource = SOURCE
    filled.push(`${s.id}: ${r.lat}, ${r.lng}  (${r.via})`)
  }

  console.log(`geocoded (${filled.length}):`)
  filled.forEach((l) => console.log(`  ${l}`))
  console.log(`needs manual check (${manual.length}):`)
  manual.forEach((l) => console.log(`  ${l}`))

  if (dry || !filled.length) {
    console.log(dry ? 'dry run: stops.json not changed.' : 'nothing to write.')
    return
  }
  writeFileSync(stopsPath, JSON.stringify(stops, null, 2) + '\n')
  console.log('wrote src/data/stops.json. Run npm run check:data and review the diff.')
}

main().catch((e: Error) => {
  console.error(`geocode failed: ${e.message}`)
  process.exit(1)
})
