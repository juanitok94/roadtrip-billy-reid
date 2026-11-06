// Build-time layout for the static SVG map: us-atlas state outlines (U.S. Census Bureau) in the Albers USA projection.
// Runs only in the server component and scripts, so d3 and the atlas never reach the browser, and nothing is fetched
// at runtime. Alaska and Hawaii are omitted, and so are the territories, which Albers USA can't draw.
import { geoAlbersUsa, geoBounds, geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import atlas from 'us-atlas/states-10m.json'
import { MAP, type Stop } from '../data/types'
import { minTarget, type Rect } from './map-view'
import { STATE_NAMES } from './states'

export type MapPin = { id: string; x: number; y: number }
// area: what zooming fits (the states holding the region's stops). target: the region's button on the map.
export type MapRegion = { id: string; area: Rect; target: Rect }
export type MapLayout = { path: string; width: number; height: number; pins: MapPin[]; regions: MapRegion[] }

const WIDTH = 975
const PAD = 12
const OMITTED_FIPS = ['02', '15'] // Alaska, Hawaii
const LAST_STATE_FIPS = 56 // higher codes are territories
const r1 = (n: number) => Math.round(n * 10) / 10

type StateFeature = Feature<Geometry, { name: string }>

const topo = atlas as unknown as Topology
const everything = feature(topo, topo.objects.states as GeometryCollection) as FeatureCollection<Geometry, { name: string }>
const drawn: FeatureCollection<Geometry, { name: string }> = {
  type: 'FeatureCollection',
  features: everything.features.filter((f) => Number(f.id) <= LAST_STATE_FIPS && !OMITTED_FIPS.includes(String(f.id))),
}

const projection = geoAlbersUsa().fitWidth(WIDTH - PAD * 2, drawn)
const [tx, ty] = projection.translate()
projection.translate([tx + PAD, ty + PAD])
const toPath = geoPath(projection).digits(1)
const HEIGHT = Math.ceil(toPath.bounds(drawn)[1][1] + PAD)

export const project = (lat: number, lng: number): [number, number] | null => projection([lng, lat])

const stateFeature = (usps: string): StateFeature | undefined =>
  drawn.features.find((f) => f.properties.name === STATE_NAMES[usps])

// The state's bounding box in degrees, or null if it isn't drawn on this map.
export function stateBounds(usps: string): { west: number; south: number; east: number; north: number } | null {
  const f = stateFeature(usps)
  if (!f) return null
  const [[west, south], [east, north]] = geoBounds(f)
  return { west, south, east, north }
}

// A region's zoom area comes from the states its stops are in, not from pins, so zoom works before any coordinates
// are filled in and doesn't change when they are. Regions with no stops have no entry: they stay in the Region filter.
function computeRegions(stops: Stop[]): MapRegion[] {
  const size = minTarget(WIDTH)
  const out: MapRegion[] = []
  for (const region of MAP.regions) {
    const states = [...new Set(stops.filter((d) => d.region === region.id).map((d) => d.state))]
    const features = states.map(stateFeature).filter((f): f is StateFeature => f !== undefined)
    if (features.length === 0) continue
    const [[x0, y0], [x1, y1]] = toPath.bounds({ type: 'FeatureCollection', features })
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    out.push({
      id: region.id,
      area: { x: r1(x0), y: r1(y0), w: r1(x1 - x0), h: r1(y1 - y0) },
      target: {
        x: r1(Math.max(0, Math.min(cx - size / 2, WIDTH - size))),
        y: r1(Math.max(0, Math.min(cy - size / 2, HEIGHT - size))),
        w: size,
        h: size,
      },
    })
  }
  return out
}

export function computeLayout(stops: Stop[]): MapLayout {
  const pins: MapPin[] = []
  for (const d of stops) {
    if (d.lat === null || d.lng === null) continue
    const at = project(d.lat, d.lng)
    if (at) pins.push({ id: d.id, x: r1(at[0]), y: r1(at[1]) })
  }
  return { path: toPath(drawn) ?? '', width: WIDTH, height: HEIGHT, pins, regions: computeRegions(stops) }
}
