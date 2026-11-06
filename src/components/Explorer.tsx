'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { RowMark } from '@/components/PinMark'
import UsMap, { MapKey } from '@/components/UsMap'
import { MAP, STORE_TYPES, storeTypeLabel } from '@/data/types'
import type { MapLayout } from '@/lib/map-layout'
import { STATE_NAMES } from '@/lib/states'
import { padNumber, type ListedStop } from '@/lib/stops'
import { ALL, notifyUrl, parseChoice, readParam, readSearch, subscribeToUrl, writeParam, type FilterParam } from '@/lib/url-state'

// Every control in the filter bar shares this: at least 44px tall (a wrapped phone label can grow) and one border.
const CONTROL = 'block min-h-11 w-full border border-ink bg-transparent px-3 text-ink'
// Inputs and selects stay at 16px on phones, or iOS zooms the page when they take focus.
const FIELD_TEXT = 'text-base md:text-sm'
const OUTLINE_BUTTON =
  'inline-flex min-h-11 items-center border border-ink px-4 text-sm text-ink transition-colors hover:bg-ink hover:text-on-dark'
const LABEL = 'inline-block border border-hairline px-1.5 py-0.5 text-[11px] leading-tight text-ink-soft'
const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>
const HOURS_DISCLAIMER = "Hours change; check the store's page before you go."

const placeLabel = (d: ListedStop) => (d.city ? `${d.city}, ${d.state}` : 'Location not yet verified')
const street = (d: ListedStop) => d.address?.split(',')[0] ?? null
const directionsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
const haystack = (d: ListedStop) => [d.city, d.state, STATE_NAMES[d.state], d.address].filter(Boolean).join(' ').toLowerCase()

function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={`h-3 w-3 shrink-0 text-accent-text ${className}`} aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  )
}

// Shown under the row's button when it is expanded. Links can't sit inside a button, so this is its sibling.
function RowDetails({ d, onMap, onShowOnMap }: { d: ListedStop; onMap: boolean; onShowOnMap: () => void }) {
  return (
    <div id={`row-${d.id}-details`} className="space-y-3 pt-1 pb-4 pl-12 text-sm">
      <p className="font-serif text-base font-semibold">{d.name}</p>
      {d.address && <p>{d.address}</p>}
      {d.hoursNote && <p className="text-ink-soft">{d.hoursNote}</p>}
      {d.note && <p className="text-ink-soft">{d.note}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {d.website && (
          <a href={d.website} target="_blank" rel="noopener" className={OUTLINE_BUTTON}>
            Website{NEW_TAB}
          </a>
        )}
        {d.address && (
          <a href={directionsUrl(d.address)} target="_blank" rel="noopener" className={OUTLINE_BUTTON}>
            Directions{NEW_TAB}
          </a>
        )}
        {d.phone && (
          <a href={`tel:${d.phone.replace(/[^\d+]/g, '')}`} className={`${OUTLINE_BUTTON} tabular`}>
            {d.phone}
          </a>
        )}
        {onMap ? (
          <button type="button" onClick={onShowOnMap} className={OUTLINE_BUTTON}>
            Show on map
          </button>
        ) : (
          <p className="flex min-h-11 items-center text-xs text-ink-soft">Not on the map yet</p>
        )}
      </div>
      <p className="text-xs text-ink-soft">{HOURS_DISCLAIMER}</p>
    </div>
  )
}

function Row({
  d,
  showStreet,
  onMap,
  isExpanded,
  isHighlighted,
  onToggle,
  onShowOnMap,
}: {
  d: ListedStop
  showStreet: boolean // two stores share this row's "City, ST"
  onMap: boolean
  isExpanded: boolean
  isHighlighted: boolean
  onToggle: () => void
  onShowOnMap: () => void
}) {
  const labels = [storeTypeLabel(d.storeType), ...d.services]
  return (
    <li id={`row-${d.id}`} data-highlighted={isHighlighted || undefined} className="rt-row scroll-mt-4">
      <button
        id={`row-${d.id}-button`}
        type="button"
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? `row-${d.id}-details` : undefined}
        onClick={onToggle}
        className="rt-row-button flex min-h-11 w-full items-start gap-3 py-3 pl-1 text-left"
      >
        <RowMark type={d.storeType} number={d.number} active={isHighlighted} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-col md:flex-row md:items-baseline md:gap-2">
            <span className="font-serif text-lg leading-snug font-semibold">
              <span className="sr-only">{padNumber(d.number)}. </span>
              {placeLabel(d)}
            </span>
            {showStreet && <span className="text-xs leading-snug text-ink-soft">{street(d)}</span>}
            <span aria-hidden="true" className="rt-leader hidden md:block" />
            {d.hoursNote && <span className="tabular mt-0.5 text-xs leading-snug text-ink-soft md:mt-0">{d.hoursNote}</span>}
          </span>
          <span className="mt-2 flex flex-wrap gap-1">
            {labels.map((l) => (
              <span key={l} className={LABEL}>
                {l}
              </span>
            ))}
          </span>
        </span>
        <Chevron className={`mt-2 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && <RowDetails d={d} onMap={onMap} onShowOnMap={onShowOnMap} />}
    </li>
  )
}

// A native select's text can't wrap, so the visible label is a span and the real select sits over it, invisible.
function SelectControl({
  label,
  value,
  allOption,
  options,
  onChange,
}: {
  label: string
  value: string
  allOption: string
  options: { id: string; label: string }[]
  onChange: (id: string) => void
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 ${FIELD_TEXT}`}
      >
        <option value={ALL}>{allOption}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className={`${CONTROL} flex h-full items-center justify-between gap-1.5 py-2 text-sm leading-tight peer-hover:border-accent-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-text`}
      >
        <span className="min-w-0">{options.find((o) => o.id === value)?.label ?? allOption}</span>
        <Chevron />
      </span>
    </label>
  )
}

export default function Explorer({ entries, layout }: { entries: ListedStop[]; layout: MapLayout }) {
  // A region change only animates after the visitor has made one; a ?region= link opens already zoomed.
  const [regionTouched, setRegionTouched] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // A scroll to run once the page has rendered the change that asked for it. Always a new object, so repeating one works.
  const [jump, setJump] = useState<{ to: 'map' | 'row'; id: string } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  const regionIds = useMemo(() => MAP.regions.map((r) => r.id), [])
  const experiences = useMemo(() => [...new Set(entries.flatMap((d) => d.services))].sort((a, b) => a.localeCompare(b)), [entries])
  const types = useMemo(() => STORE_TYPES.filter((t) => entries.some((d) => d.storeType === t.id)), [entries])

  // The filters live in the URL, so links are shareable. The static HTML renders the defaults (server snapshot); the
  // client then reads the real address bar.
  const search = useSyncExternalStore(subscribeToUrl, readSearch, () => '')
  const region = parseChoice(search, 'region', regionIds)
  const experience = parseChoice(search, 'experience', experiences)
  const storeType = parseChoice(search, 'type', types.map((t) => t.id))
  const rawQuery = readParam(search, 'q') ?? ''
  const q = rawQuery.trim().toLowerCase()

  const setFilter = (name: FilterParam, value: string) => {
    writeParam(name, value)
    notifyUrl()
  }
  const setRegion = (id: string) => {
    setRegionTouched(true)
    setFilter('region', id)
  }

  // Everything the other filters allow, before the region narrows it. The map's region buttons count these.
  const inScope = useMemo(
    () =>
      entries.filter((d) => {
        if (experience !== ALL && !d.services.includes(experience)) return false
        if (storeType !== ALL && d.storeType !== storeType) return false
        return !q || haystack(d).includes(q)
      }),
    [entries, experience, storeType, q],
  )
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const d of inScope) if (d.region) counts[d.region] = (counts[d.region] ?? 0) + 1
    return counts
  }, [inScope])
  const visible = useMemo(() => inScope.filter((d) => region === ALL || d.region === region), [inScope, region])

  const pinIds = useMemo(() => new Set(layout.pins.map((p) => p.id)), [layout])
  const mapped = useMemo(() => visible.filter((d) => pinIds.has(d.id)), [visible, pinIds])
  // Two stores can share a "City, ST"; those rows also name the street, so they can be told apart at a glance.
  const sharedPlaces = useMemo(() => {
    const seen = new Map<string, number>()
    for (const d of entries) seen.set(placeLabel(d), (seen.get(placeLabel(d)) ?? 0) + 1)
    return new Set([...seen].filter(([, n]) => n > 1).map(([place]) => place))
  }, [entries])
  // A selection or an open row only counts while its entry is still shown.
  const selected = visible.find((d) => d.id === selectedId && pinIds.has(d.id)) ?? null
  const expanded = visible.find((d) => d.id === expandedId)?.id ?? null
  const filtersActive = q !== '' || region !== ALL || experience !== ALL || storeType !== ALL

  const reset = () => {
    setRegionTouched(true)
    for (const name of ['region', 'experience', 'type', 'q'] as const) writeParam(name, '')
    notifyUrl()
  }

  // The open row and the selected pin stay linked: leaving a row also clears its pin.
  function toggleRow(id: string) {
    const opening = expanded !== id
    setExpandedId(opening ? id : null)
    if (selected?.id !== id || !opening) setSelectedId(null)
  }

  function showOnMap(d: ListedStop) {
    setSelectedId(d.id)
    if (d.region) setRegion(d.region)
    setJump({ to: 'map', id: d.id })
  }

  function selectPin(id: string) {
    setSelectedId(id)
    setExpandedId(id)
    setJump({ to: 'row', id })
  }

  useEffect(() => {
    if (!jump) return
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (jump.to === 'map') {
      mapRef.current?.scrollIntoView({ behavior, block: 'start' })
      // The pin is now the thing in view, so keyboard users continue from there.
      mapRef.current?.querySelector<SVGGElement>(`[data-pin="${jump.id}"]`)?.focus({ preventScroll: true })
    } else {
      document.getElementById(`row-${jump.id}`)?.scrollIntoView({ behavior, block: 'start' })
      // The row is now the thing in view, so keyboard users continue from there.
      document.getElementById(`row-${jump.id}-button`)?.focus({ preventScroll: true })
    }
  }, [jump])

  // Escape collapses the open row and leaves focus on it. Only from the row, its pin or nowhere in particular: a
  // search field should keep its focus.
  useEffect(() => {
    if (!expanded) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const row = document.getElementById(`row-${expanded}`)
      const target = e.target instanceof Element ? e.target : null
      if (target && target !== document.body && !row?.contains(target) && !target.closest('.rt-pin')) return
      setExpandedId(null)
      setSelectedId(null)
      document.getElementById(`row-${expanded}-button`)?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [expanded])

  return (
    <div>
      <div ref={mapRef} className="scroll-mt-4">
        <UsMap
          layout={layout}
          entries={mapped}
          selectedId={selected?.id ?? null}
          onSelect={selectPin}
          regionId={region}
          regionCounts={regionCounts}
          onRegion={setRegion}
          animate={regionTouched}
        />
      </div>
      <MapKey stops={mapped} />
      {entries.length > 0 && mapped.length === 0 && (
        <p className="mt-2 text-center text-xs text-ink-soft">
          {layout.pins.length === 0 ? 'No stores are on the map yet. Every store is in the list below.' : 'Nothing to show on the map for these filters.'}
        </p>
      )}

      <section aria-labelledby="filters-heading" className="mt-6">
        <h2 id="filters-heading" className="sr-only">
          Find a store
        </h2>
        <div className="space-y-2">
          <label className="block">
            <span className="sr-only">Search by city, state or address</span>
            <input
              type="search"
              placeholder="City, state or address"
              value={rawQuery}
              onChange={(e) => setFilter('q', e.target.value)}
              className={`${CONTROL} ${FIELD_TEXT}`}
            />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <SelectControl label="Region" value={region} allOption="All regions" options={MAP.regions} onChange={setRegion} />
            <SelectControl
              label="Experience"
              value={experience}
              allOption="All experiences"
              options={experiences.map((e) => ({ id: e, label: e }))}
              onChange={(id) => setFilter('experience', id)}
            />
            <SelectControl label="Store type" value={storeType} allOption="All store types" options={types} onChange={(id) => setFilter('type', id)} />
          </div>
          <div className="flex min-h-11 flex-wrap items-center gap-4">
            <p role="status" className="tabular text-xs text-ink-soft">
              Showing {visible.length} of {entries.length}
            </p>
            {filtersActive && (
              <button type="button" onClick={reset} className={OUTLINE_BUTTON}>
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="stores-heading" className="mt-4">
        <h2 id="stores-heading" className="text-xs tracking-[0.2em] text-accent-text uppercase">
          Stores
        </h2>
        {entries.length === 0 ? (
          <p className="rt-ruled mt-2 py-6 text-center font-serif text-xl font-semibold">Stores are being added and verified.</p>
        ) : visible.length === 0 ? (
          <div className="rt-ruled mt-2 py-6 text-center">
            <p className="font-serif text-xl font-semibold">No stores match</p>
            <button type="button" onClick={reset} className={`${OUTLINE_BUTTON} mt-3`}>
              Reset
            </button>
          </div>
        ) : (
          <ul className="rt-ruled mt-2">
            {visible.map((d) => (
              <Row
                key={d.id}
                d={d}
                showStreet={sharedPlaces.has(placeLabel(d))}
                onMap={pinIds.has(d.id)}
                isExpanded={expanded === d.id}
                isHighlighted={selected?.id === d.id}
                onToggle={() => toggleRow(d.id)}
                onShowOnMap={() => showOnMap(d)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
