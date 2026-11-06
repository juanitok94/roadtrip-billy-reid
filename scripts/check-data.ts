// Validates src/data/map.json and src/data/stops.json. Run: npm run check:data (also runs before every build).
// --verbose lists every warning. Fails (exit 1) on rule violations; warns on details still to be filled in.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MAP, STORE_TYPES, type Stop } from '../src/data/types'
import { computeLayout, project, stateBounds } from '../src/lib/map-layout'
import { minTarget, type Rect } from '../src/lib/map-view'
import { STATE_NAMES } from '../src/lib/states'
import { contrast, graphicPairs, readTokens, textPairs } from './contrast'

const data = JSON.parse(readFileSync(join(process.cwd(), 'src/data/stops.json'), 'utf8')) as Stop[]
const errors: string[] = []
const warnings: string[] = []

const STATUSES = ['open', 'closed', 'unknown']
const TYPES = STORE_TYPES.map((t) => t.id as string)
const DATE = /^\d{4}-\d{2}-\d{2}$/
const HEX = /^#[0-9a-fA-F]{6}$/
const blank = (v: unknown) => typeof v !== 'string' || v.trim() === ''
const BOUNDS_MARGIN = 0.1 // degrees: a waterfront address can sit just past the outline's simplified edge

// --- design tokens: every pair in use must pass AA (npm run check:contrast prints them)
const TOKENS = readTokens()
for (const p of textPairs(TOKENS)) {
  const c = contrast(p.fg, p.bg)
  if (c < 4.5) errors.push(`contrast: ${p.name} is ${c.toFixed(2)}:1; AA needs 4.5:1`)
}
for (const p of graphicPairs(TOKENS)) {
  const c = contrast(p.fg, p.bg)
  if (c < 3) errors.push(`contrast: ${p.name} is ${c.toFixed(2)}:1; AA needs 3:1`)
}

// --- map.json
if (blank(MAP.id)) errors.push('map.json: missing id')
if (blank(MAP.title)) errors.push('map.json: missing title')
if (blank(MAP.kicker)) errors.push('map.json: missing kicker')
if (!HEX.test(MAP.accent)) errors.push('map.json: accent must be #rrggbb')
else if (MAP.accent.toLowerCase() !== TOKENS['--accent-text']?.toLowerCase())
  errors.push('map.json: accent must equal --accent-text in globals.css (the theme colour reads it)')
if (!HEX.test(MAP.themeColor)) errors.push('map.json: themeColor must be #rrggbb')
else if (MAP.themeColor.toLowerCase() !== TOKENS['--page']?.toLowerCase())
  errors.push('map.json: themeColor must equal --page in globals.css (the theme-color meta tag reads it)')
if (!Array.isArray(MAP.credits) || MAP.credits.some(blank)) errors.push('map.json: credits must be non-empty strings')
const regionIds = new Set<string>()
for (const r of MAP.regions) {
  if (blank(r.id) || blank(r.label)) errors.push('map.json: every region needs id and label')
  else if (regionIds.has(r.id)) errors.push(`map.json: duplicate region id "${r.id}"`)
  else regionIds.add(r.id)
}
if (MAP.virtualStore && (blank(MAP.virtualStore.name) || !Array.isArray(MAP.virtualStore.services)))
  errors.push('map.json: virtualStore needs name and services')
if (MAP.virtualStore?.verifiedOn) {
  if (!DATE.test(MAP.virtualStore.verifiedOn)) errors.push('map.json: virtualStore verifiedOn must be YYYY-MM-DD')
  if (!MAP.virtualStore.sourceUrl?.startsWith('https://')) errors.push('map.json: virtualStore verifiedOn is set but sourceUrl is missing or not https://')
}

// --- stops.json
if (!Array.isArray(data)) errors.push('stops.json must be an array')
const ids = new Set<string>()
data.forEach((d, i) => {
  const at = `#${i + 1} ${d.name ?? '(no name)'}`
  if (blank(d.id)) errors.push(`${at}: missing id`)
  else if (ids.has(d.id)) errors.push(`${at}: duplicate id "${d.id}"`)
  else ids.add(d.id)
  if (d.mapId !== MAP.id) errors.push(`${at}: mapId must be "${MAP.id}" (got "${d.mapId}")`)
  if (!STATE_NAMES[d.state]) errors.push(`${at}: state "${d.state}" must be a USPS code listed in src/lib/states.ts`)
  else if (!stateBounds(d.state)) errors.push(`${at}: ${d.state} is not drawn on this map`)
  if (blank(d.name)) errors.push(`${at}: missing name`)
  if (blank(d.sourceNote)) errors.push(`${at}: missing sourceNote`)
  if (!STATUSES.includes(d.status)) errors.push(`${at}: status must be open, closed or unknown (got "${d.status}")`)
  if (!TYPES.includes(d.storeType)) errors.push(`${at}: storeType must be ${TYPES.join(', ')} (got "${d.storeType}")`)
  if (d.region === null) warnings.push(`${at}: no region`)
  else if (!regionIds.has(d.region)) errors.push(`${at}: region must be one of map.json's ids (got "${d.region}")`)

  if (!Array.isArray(d.services)) errors.push(`${at}: services must be an array ([] if none)`)
  else {
    if (d.services.some(blank)) errors.push(`${at}: services must be non-empty strings`)
    if (new Set(d.services).size !== d.services.length) errors.push(`${at}: duplicate service`)
  }

  // Source rule: an https sourceUrl is required once verifiedOn is set.
  if (d.verifiedOn !== null) {
    if (!DATE.test(d.verifiedOn)) errors.push(`${at}: verifiedOn must be YYYY-MM-DD`)
    if (blank(d.sourceUrl) || !d.sourceUrl!.startsWith('https://')) errors.push(`${at}: verifiedOn is set but sourceUrl is missing or not https://`)
  } else warnings.push(`${at}: not verified`)
  if (d.sourceUrl !== null && !d.sourceUrl.startsWith('https://')) errors.push(`${at}: sourceUrl must start with https://`)
  if (d.website !== null && !d.website.startsWith('https://')) warnings.push(`${at}: website is not https`)
  if (d.status === 'unknown') warnings.push(`${at}: status is unknown`)

  if ((d.lat === null) !== (d.lng === null)) errors.push(`${at}: lat and lng must both be set or both null`)
  if (d.lat === null) warnings.push(`${at}: no coordinates yet (no pin)`)
  else if (d.lng !== null) {
    if (!d.geocodeSource) errors.push(`${at}: geocodeSource is required once lat/lng are set`)
    const box = stateBounds(d.state)
    if (!project(d.lat, d.lng)) errors.push(`${at}: lat/lng can't be drawn on this map`)
    else if (
      box &&
      (d.lat < box.south - BOUNDS_MARGIN || d.lat > box.north + BOUNDS_MARGIN || d.lng < box.west - BOUNDS_MARGIN || d.lng > box.east + BOUNDS_MARGIN)
    )
      errors.push(`${at}: lat/lng outside ${d.state}'s bounding box`)
  }
})

// --- region targets on the map: closed stops don't count, the same as the page
const visitors = data.filter((d) => d.status !== 'closed')
const layout = computeLayout(visitors)
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
layout.regions.forEach((r, i) => {
  if (r.target.w < minTarget(layout.width) || r.target.h < minTarget(layout.width)) errors.push(`region ${r.id}: target is under 44px on a phone`)
  layout.regions.slice(i + 1).forEach((o) => {
    if (overlap(r.target, o.target)) errors.push(`regions ${r.id} and ${o.id}: map targets overlap`)
  })
})

if (process.argv.includes('--verbose')) warnings.forEach((w) => console.warn(`warn: ${w}`))
else if (warnings.length) console.warn(`warn: ${warnings.length} warnings (use --verbose to list)`)
errors.forEach((e) => console.error(`error: ${e}`))

const count = (test: (d: Stop) => boolean) => data.filter(test).length
console.log(
  `check:data ${MAP.id} | total ${data.length} | on map ${count((d) => d.lat !== null && d.lng !== null)} | verified ${count((d) => d.verifiedOn !== null)} | unverified ${count((d) => d.verifiedOn === null)} | closed (hidden) ${count((d) => d.status === 'closed')}`,
)
console.log(`  status: ${STATUSES.map((s) => `${s} ${count((d) => d.status === s)}`).join(' | ')}`)
console.log(`  type:   ${STORE_TYPES.map((t) => `${t.id} ${count((d) => d.storeType === t.id)}`).join(' | ')}`)
console.log(`  region: ${MAP.regions.map((r) => `${r.id} ${count((d) => d.region === r.id)}`).join(' | ')}`)
data.filter((d) => d.status === 'closed').forEach((d) => console.log(`  closed, hidden from visitors (keep in data): ${d.id}`))
if (errors.length) {
  console.error(`${errors.length} error(s)`)
  process.exit(1)
}
