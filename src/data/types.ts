// Shared record shape for the map family. Additions here: Stop.storeType, Stop.services, MapConfig.virtualStore.
import mapConfig from './map.json'

export type Status = 'open' | 'closed' | 'unknown'
export type StoreType = 'retail' | 'custom-showroom' | 'outlet'

export type RegionDef = { id: string; label: string }

// An online appointment, not a place to drive to: listed in the footer, never on the map or in stops.json.
export type VirtualStore = { name: string; note: string; services: string[] }

// Matches src/data/map.json.
export type MapConfig = {
  id: string
  title: string
  kicker: string
  seoTitle?: string // the <title> and social title; falls back to title
  seoDescription?: string // the meta description and the header's description line
  state: string // "US": this map covers the country, so each stop names its own state
  fips: string | null // null: this map draws every state rather than one
  regions: RegionDef[]
  accent: string // hex; must equal --rust in globals.css (check:data enforces it)
  credits: string[]
  virtualStore?: VirtualStore
}

export const MAP: MapConfig = mapConfig

// Matches src/data/stops.json. Every fact needs a source and a verifiedOn date.
export type Stop = {
  id: string
  mapId: string // must equal map.json id
  state: string // 2-letter USPS code, or "DC"
  name: string
  storeType: StoreType
  region: string | null // one of map.json region ids
  city: string | null
  address: string | null
  lat: number | null
  lng: number | null
  geocodeSource?: string | null // added by npm run geocode; required once lat/lng are set
  phone: string | null
  website: string | null
  hoursNote: string | null
  services: string[] // the store's listed experiences, exactly as its site writes them; [] if none
  status: Status
  blurb: string | null
  sourceUrl: string | null // required (https) once verifiedOn is set
  sourceNote: string
  verifiedOn: string | null // YYYY-MM-DD
  note: string | null // anything a visitor should know that has no field of its own
}

// Fixed display order and wording; the shape on the map comes from the type (see PinMark).
export const STORE_TYPES: { id: StoreType; label: string }[] = [
  { id: 'retail', label: 'Retail store' },
  { id: 'custom-showroom', label: 'Custom showroom' },
  { id: 'outlet', label: 'Outlet' },
]

export const storeTypeLabel = (t: StoreType): string => STORE_TYPES.find((s) => s.id === t)?.label ?? t
