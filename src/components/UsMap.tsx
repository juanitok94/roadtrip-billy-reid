'use client'

// The U.S. map, drawn at build time from us-atlas (src/lib/map-layout.ts). No tiles, no map library. Zooming to a
// region only changes the nested viewBox (instant under prefers-reduced-motion); pins keep their on-screen size.
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { KeyMark, PIN_RING, PIN_RING_SELECTED, PinMark, TripBadge, pinShape } from '@/components/PinMark'
import { MAP, STORE_TYPES, storeTypeLabel } from '@/data/types'
import type { MapLayout, MapRegion } from '@/lib/map-layout'
import { CHAR_W, LABEL_PX, PIN_PX, TARGET_PX, fitView, lerpView, placePins, toPx, type Rect } from '@/lib/map-view'
import { padNumber, type ListedStop } from '@/lib/stops'
import { ALL } from '@/lib/url-state'

const ZOOM_MS = 450
const PHONE_QUERY = '(max-width: 767.98px)'
const DEFAULT_PX_W = 990 // the column's full width, used until the browser has measured it

const subscribePhone = (onChange: () => void) => {
  const mq = window.matchMedia(PHONE_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}
const readPhone = () => window.matchMedia(PHONE_QUERY).matches

const stores = (n: number) => `${n} ${n === 1 ? 'store' : 'stores'}`
const regionName = (id: string) => MAP.regions.find((r) => r.id === id)?.label ?? id
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export function pinLabel(d: ListedStop, tripStop: number | null = null): string {
  const where = d.city ? `${d.city}, ${d.state}` : d.state
  return `${padNumber(d.number)}: ${where}, ${storeTypeLabel(d.storeType)}${tripStop ? `, trip stop ${tripStop}` : ''}`
}

const TRIP_DASH = '6 5'

// Consecutive trip stops that both have pins: the legs the dashed line draws.
function tripLegs(trip: string[], pinned: (id: string) => boolean): [string, string][] {
  const legs: [string, string][] = []
  for (let i = 0; i + 1 < trip.length; i++) if (pinned(trip[i]) && pinned(trip[i + 1])) legs.push([trip[i], trip[i + 1]])
  return legs
}

// One quiet, non-interactive row under the map: the shape for each store type that has a pin, and the trip line when
// one is drawn.
export function MapKey({ stops, trip = [] }: { stops: ListedStop[]; trip?: string[] }) {
  const types = STORE_TYPES.filter((t) => stops.some((d) => d.storeType === t.id))
  const ids = new Set(stops.map((d) => d.id))
  const hasLine = tripLegs(trip, (id) => ids.has(id)).length > 0
  if (types.length === 0 && !hasLine) return null
  return (
    <ul aria-label="Map key" className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-ink-soft">
      {types.map((t) => (
        <li key={t.id} className="flex items-center gap-1.5">
          <KeyMark type={t.id} />
          {t.label}
        </li>
      ))}
      {hasLine && (
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 6" width="24" height="6" aria-hidden="true" className="block shrink-0">
            <line x1="0" y1="3" x2="24" y2="3" stroke="var(--accent-text)" strokeWidth="2" strokeDasharray={TRIP_DASH} />
          </svg>
          Trip order (straight lines)
        </li>
      )}
    </ul>
  )
}

function viewFor(regionId: string, regions: MapRegion[], whole: Rect): Rect {
  const area = regions.find((r) => r.id === regionId)?.area
  return area ? fitView(area, whole) : whole
}

export default function UsMap({
  layout,
  entries,
  trip,
  selectedId,
  onSelect,
  regionId,
  regionCounts,
  onRegion,
  animate,
}: {
  layout: MapLayout
  entries: ListedStop[]
  trip: string[] // trip stop ids in order
  selectedId: string | null
  onSelect: (id: string) => void
  regionId: string
  regionCounts: Record<string, number>
  onRegion: (id: string) => void
  animate: boolean
}) {
  const { width, height, regions } = layout
  const isPhone = useSyncExternalStore(subscribePhone, readPhone, () => false)
  const [pxW, setPxW] = useState(DEFAULT_PX_W)
  const wrapRef = useRef<HTMLDivElement>(null)
  const wholeRef = useRef<HTMLButtonElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  // Where focus goes after a zoom, because the control just used goes away.
  const focusAfter = useRef<string | null>(null)

  const active = regions.find((r) => r.id === regionId) ?? null
  const [view, setView] = useState<Rect>({ x: 0, y: 0, w: width, h: height })
  const [moving, setMoving] = useState(false)
  const viewRef = useRef<Rect>(view)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      if (e.contentRect.width > 0) setPxW(e.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const from = viewRef.current
    const target = viewFor(regionId, regions, { x: 0, y: 0, w: width, h: height })
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = animate && !reduce ? ZOOM_MS : 0
    let frame = 0
    let start: number | null = null
    const tick = (now: number) => {
      start ??= now
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration)
      const next = t === 1 ? target : lerpView(from, target, easeInOut(t))
      viewRef.current = next
      setView(next)
      setMoving(t < 1)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [regionId, regions, width, height, animate])

  useEffect(() => {
    const want = focusAfter.current
    if (!want) return
    focusAfter.current = null
    if (want === 'whole') wholeRef.current?.focus({ preventScroll: true })
    else svgRef.current?.querySelector<SVGGElement>(`[data-region="${want}"]`)?.focus({ preventScroll: true })
  }, [regionId])

  const zoomTo = (id: string) => {
    focusAfter.current = 'whole'
    onRegion(id)
  }
  const zoomOut = () => {
    focusAfter.current = regionId
    onRegion(ALL)
  }

  const pxH = (pxW * height) / width
  const pinById = new Map(layout.pins.map((p) => [p.id, p]))
  const stops = entries.filter((d) => pinById.has(d.id))

  // On a phone's whole-map view the regions are the targets: there is no room to give every pin 44px, so pins are
  // only spaced to keep their numbers readable. Everywhere else each pin is a button with its own 44px.
  const pinsLive = !isPhone || active !== null
  const gap = pinsLive ? TARGET_PX : PIN_PX + 2
  const spots = placePins(
    stops.map((d) => {
      const p = pinById.get(d.id)!
      return { id: d.id, ...toPx(pxW, view, p.x, p.y) }
    }),
    gap,
    pxW,
    pxH,
  )

  const tripStop = (id: string) => {
    const i = trip.indexOf(id)
    return i === -1 ? null : i + 1
  }
  const legs = tripLegs(trip, (id) => spots.has(id))

  const onKey = (e: KeyboardEvent<SVGGElement>, run: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      run()
    }
  }

  return (
    <>
      <section
        ref={wrapRef}
        aria-label={`Map of stores (${MAP.title}). The list below the map is the accessible alternative to this map.`}
        className="rt-intro-map border border-hairline"
      >
        <svg ref={svgRef} viewBox={`0 0 ${pxW} ${pxH}`} className="block h-auto w-full">
          <svg x="0" y="0" width={pxW} height={pxH} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}>
            <path
              d={layout.path}
              className="rt-land"
              vectorEffect="non-scaling-stroke"
            />
            {!active &&
              regions.map((r) => (
                <g
                  key={r.id}
                  data-region={r.id}
                  className="rt-region"
                  role="button"
                  tabIndex={0}
                  aria-label={`Zoom to ${regionName(r.id)}, ${stores(regionCounts[r.id] ?? 0)}`}
                  onClick={() => zoomTo(r.id)}
                  onKeyDown={(e) => onKey(e, () => zoomTo(r.id))}
                >
                  <rect
                    className="rt-region-box"
                    x={r.target.x}
                    y={r.target.y}
                    width={r.target.w}
                    height={r.target.h}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              ))}
          </svg>

          {!active && !moving && (
            <g aria-hidden="true" pointerEvents="none">
              {regions.map((r) => {
                const name = regionName(r.id)
                const half = (name.length * CHAR_W) / 2
                const at = toPx(pxW, view, r.target.x + r.target.w / 2, r.target.y)
                const x = Math.max(half + 2, Math.min(at.x, pxW - half - 2))
                const y = Math.max(LABEL_PX, at.y - 4)
                // A label a pin would cover is left out; its button and the Region filter still name the region.
                const covered = stops.some((d) => {
                  const s = spots.get(d.id)
                  return s && Math.abs(s.x - x) < half + PIN_PX / 2 && Math.abs(s.y - (y - LABEL_PX / 2)) < (LABEL_PX + PIN_PX) / 2
                })
                if (covered) return null
                return (
                  <text
                    key={r.id}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fontSize={LABEL_PX}
                    fill="var(--ink-soft)"
                    stroke="var(--page)"
                    strokeWidth="3"
                    paintOrder="stroke"
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}
                  >
                    {name}
                  </text>
                )
              })}
            </g>
          )}

          {!moving && (
            <g aria-hidden="true" pointerEvents="none">
              {stops.map((d) => {
                const s = spots.get(d.id)
                // A pin that had to move draws a leader back to its true spot.
                if (!s || Math.hypot(s.x - s.x0, s.y - s.y0) < 2) return null
                return (
                  <g key={d.id}>
                    <line x1={s.x} y1={s.y} x2={s.x0} y2={s.y0} stroke="var(--ink)" strokeWidth="1" />
                    <circle cx={s.x0} cy={s.y0} r="2" fill="var(--ink)" />
                  </g>
                )
              })}
            </g>
          )}

          {/* The trip: straight dashed lines between stops in order, under the pins. Not a route. */}
          {legs.length > 0 && (
            <g aria-hidden="true" pointerEvents="none">
              {legs.map(([a, b]) => {
                const p = spots.get(a)!
                const q = spots.get(b)!
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={p.x}
                    y1={p.y}
                    x2={q.x}
                    y2={q.y}
                    stroke="var(--accent-text)"
                    strokeWidth="2"
                    strokeDasharray={TRIP_DASH}
                  />
                )
              })}
            </g>
          )}

          {stops.map((d, i) => {
            const s = spots.get(d.id)
            if (!s) return null
            const selected = d.id === selectedId
            const order = tripStop(d.id)
            return (
              <g
                key={d.id}
                data-pin={d.id}
                className="rt-pin"
                transform={`translate(${s.x} ${s.y})`}
                style={pinsLive ? undefined : { pointerEvents: 'none' }}
                {...(pinsLive
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      'aria-label': pinLabel(d, order),
                      'aria-expanded': selected,
                      'aria-controls': selected ? `row-${d.id}-details` : undefined,
                      onClick: () => onSelect(d.id),
                      onKeyDown: (e: KeyboardEvent<SVGGElement>) => onKey(e, () => onSelect(d.id)),
                    }
                  : { 'aria-hidden': true })}
              >
                <rect x={-TARGET_PX / 2} y={-TARGET_PX / 2} width={TARGET_PX} height={TARGET_PX} fill="transparent" />
                {/* Three layers, so no two effects share a transform: the <g> above places the pin, .rt-pin-lift
                    answers hover and focus, .rt-pin-drop plays the load-in (in list order, via --i). The 44px target
                    never moves. */}
                <g className="rt-pin-lift">
                  <g className="rt-pin-drop" style={{ '--i': i } as React.CSSProperties}>
                    {pinShape(d.storeType, selected ? PIN_RING_SELECTED : PIN_RING, { className: 'rt-ring' })}
                    <PinMark type={d.storeType} number={d.number} active={selected} />
                    {order !== null && <TripBadge n={order} />}
                  </g>
                </g>
              </g>
            )
          })}
        </svg>
      </section>

      {regions.length > 0 && (
        <div className="mt-2 flex min-h-6 flex-wrap items-center justify-center gap-x-3 text-xs text-ink-soft">
          {active ? (
            <>
              <button
                ref={wholeRef}
                type="button"
                onClick={zoomOut}
                className="min-h-11 border border-ink px-4 text-sm text-ink transition-colors hover:bg-ink hover:text-page"
              >
                Whole map
              </button>
              <span>
                {regionName(active.id)} · {stores(regionCounts[active.id] ?? 0)}
              </span>
            </>
          ) : (
            <>
              <span className="md:hidden">Tap a region to zoom in.</span>
              <span className="hidden md:inline">Click a region to zoom in.</span>
            </>
          )}
        </div>
      )}
    </>
  )
}
