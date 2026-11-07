'use client'

import { useEffect, useRef, useState } from 'react'
import { HOURS_DISCLAIMER, LABEL, OUTLINE_BUTTON, placeLabel, shortName, street } from '@/components/ui'
import type { ListedStop } from '@/lib/stops'
import { formatMi, hasCoords, legDirectionsUrl, legMiles } from '@/lib/trip'

const SMALL_BUTTON =
  'inline-flex min-h-11 min-w-11 items-center justify-center border border-ink px-3 text-sm text-ink transition-colors duration-150 ease-out hover:border-ink-hover hover:bg-ink hover:text-page disabled:cursor-not-allowed disabled:border-hairline disabled:text-ink-soft disabled:hover:border-hairline disabled:hover:bg-transparent'

export type TripActions = {
  move: (id: string, by: -1 | 1) => void
  remove: (id: string) => void
  start: (id: string) => void
  suggest: () => void
  clear: () => void
}

// The total ticks from its old value to the new one over 300ms (eased out), and jumps under reduced motion.
function useTicker(target: number, ms = 300): number {
  const [shown, setShown] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = from.current
    if (start === target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let t0: number | null = null
    const step = (now: number) => {
      t0 ??= now
      const t = reduce ? 1 : Math.min(1, (now - t0) / ms)
      const v = t === 1 ? target : start + (target - start) * (1 - (1 - t) ** 3)
      from.current = v
      setShown(v)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, ms])
  return shown
}

function Badge({ n, pop }: { n: number; pop: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`tabular flex h-7 w-7 shrink-0 items-center justify-center bg-ink text-sm text-page print:border print:border-ink ${pop ? 'rt-pop' : ''}`}
    >
      {n}
    </span>
  )
}

export default function TripPanel({
  stops,
  freshStop,
  ignored,
  sharedPlaces,
  open,
  onToggleOpen,
  canSuggest,
  announcement,
  actions,
}: {
  stops: ListedStop[]
  freshStop: string | null // just added: its badge pops in
  ignored: number // ids in the link that aren't in this guide
  sharedPlaces: Set<string>
  open: boolean
  onToggleOpen: () => void
  canSuggest: boolean // the current order differs from nearest-first
  announcement: string
  actions: TripActions
}) {
  const [copyStatus, setCopyStatus] = useState('')
  // "Copy trip link" reads "Copied" for 2 seconds after a successful copy.
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(copiedTimer.current), [])
  // After a move or removal the control used may have moved or gone; focus follows the stop (or the heading).
  const focusNext = useRef<string | null>(null)
  const ids = stops.map((d) => d.id).join(',')

  useEffect(() => {
    const want = focusNext.current
    if (!want) return
    focusNext.current = null
    document.getElementById(want)?.focus({ preventScroll: false })
  }, [ids])

  const legs = legMiles(stops)
  const measured = legs.filter((m): m is number => m !== null)
  const total = measured.reduce((a, b) => a + b, 0)
  const shownTotal = useTicker(total)
  const unmeasured = legs.length - measured.length
  const mappedCount = stops.filter(hasCoords).length
  const name = (d: ListedStop) => shortName(d, sharedPlaces.has(placeLabel(d)))

  function move(d: ListedStop, i: number, by: -1 | 1) {
    const to = i + by
    // Keep focus on the same button unless it is now disabled at the end of the list.
    const atEnd = to === 0 || to === stops.length - 1
    focusNext.current = `trip-${d.id}-${atEnd ? (by === -1 ? 'down' : 'up') : by === -1 ? 'up' : 'down'}`
    actions.move(d.id, by)
  }
  function remove(i: number) {
    const next = stops[i + 1] ?? stops[i - 1]
    focusNext.current = next ? `trip-${next.id}` : 'trip-heading-button'
    actions.remove(stops[i].id)
  }
  function start(d: ListedStop) {
    focusNext.current = `trip-${d.id}`
    actions.start(d.id)
  }
  function clear() {
    focusNext.current = 'trip-heading-button'
    actions.clear()
  }

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?trip=${ids}`
    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus('Trip link copied.')
      setCopied(true)
      window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyStatus("Couldn't copy. The address bar has the trip link.")
    }
  }

  function printTrip() {
    const root = document.documentElement
    root.classList.add('rt-print-trip')
    const done = () => {
      root.classList.remove('rt-print-trip')
      window.removeEventListener('afterprint', done)
    }
    window.addEventListener('afterprint', done)
    window.print()
  }

  return (
    <section aria-labelledby="trip-heading" className="rt-trip mt-6 border border-hairline">
      <h2 id="trip-heading" className="m-0">
        <button
          id="trip-heading-button"
          type="button"
          aria-expanded={open}
          aria-controls="trip-body"
          onClick={onToggleOpen}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs tracking-[0.2em] text-accent-text uppercase"
        >
          <span>
            Your trip <span className="tabular">({stops.length})</span>
          </span>
          <svg viewBox="0 0 12 12" aria-hidden="true" className={`rt-no-print h-3 w-3 shrink-0 ${open ? 'rotate-180' : ''}`}>
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
          </svg>
        </button>
      </h2>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div id="trip-body" className={`rt-trip-body border-t border-hairline px-4 pt-3 pb-4 ${open ? '' : 'hidden'}`}>
        {ignored > 0 && (
          <p className="rt-no-print mb-3 text-xs text-ink-soft">
            {ignored === 1 ? '1 stop in this link isn’t in the guide and was left out.' : `${ignored} stops in this link aren’t in the guide and were left out.`}
          </p>
        )}

        {stops.length === 0 ? (
          <p className="text-sm text-ink-soft">No stops yet. Use “Add to trip” on a store in the list, or on a pin’s details.</p>
        ) : (
          <>
            <ol className="rt-ruled">
              {stops.map((d, i) => {
                const leg = i < legs.length ? legs[i] : undefined
                const next = stops[i + 1]
                return (
                  <li key={d.id} id={`trip-${d.id}`} tabIndex={-1} className="rt-row py-3">
                    <div className="flex items-start gap-3">
                      <Badge n={i + 1} pop={d.id === freshStop} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-serif text-lg leading-snug font-semibold">
                          <span className="sr-only">Stop {i + 1}: </span>
                          {placeLabel(d)}
                          {sharedPlaces.has(placeLabel(d)) && street(d) && (
                            <span className="ml-2 font-mono text-xs font-medium text-ink-soft">{street(d)}</span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {i === 0 && <span className={LABEL}>Start</span>}
                          {!hasCoords(d) && <span className={LABEL}>Not on map yet</span>}
                        </div>
                        {d.address && <p className="text-sm">{d.address}</p>}
                        {d.hoursNote && <p className="tabular text-xs text-ink-soft">{d.hoursNote}</p>}
                        <div className="rt-no-print flex flex-wrap gap-2 pt-2">
                          <button
                            id={`trip-${d.id}-up`}
                            type="button"
                            disabled={i === 0}
                            onClick={() => move(d, i, -1)}
                            aria-label={`Move ${name(d)} up`}
                            className={SMALL_BUTTON}
                          >
                            <span aria-hidden="true">↑ Up</span>
                          </button>
                          <button
                            id={`trip-${d.id}-down`}
                            type="button"
                            disabled={i === stops.length - 1}
                            onClick={() => move(d, i, 1)}
                            aria-label={`Move ${name(d)} down`}
                            className={SMALL_BUTTON}
                          >
                            <span aria-hidden="true">↓ Down</span>
                          </button>
                          {i > 0 && hasCoords(d) && (
                            <button type="button" onClick={() => start(d)} aria-label={`Start here: ${name(d)}`} className={SMALL_BUTTON}>
                              Start here
                            </button>
                          )}
                          <button type="button" onClick={() => remove(i)} aria-label={`Remove ${name(d)} from trip`} className={SMALL_BUTTON}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    {next && (
                      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pl-10 text-xs text-ink-soft">
                        <span className="tabular">
                          <span aria-hidden="true">↓ </span>
                          {leg != null ? (
                            <>approx. {formatMi(leg)} mi straight-line to {next.city ?? next.name}</>
                          ) : (
                            <>No distance to {next.city ?? next.name}: a stop is not on the map yet</>
                          )}
                        </span>
                        {d.address && next.address && (
                          <a
                            href={legDirectionsUrl(d.address, next.address)}
                            target="_blank"
                            rel="noopener"
                            aria-label={`Directions from ${name(d)} to ${name(next)} (opens in a new tab)`}
                            className="rt-no-print inline-flex min-h-11 items-center text-accent-text underline underline-offset-2 hover:text-ink-hover"
                          >
                            Directions
                          </a>
                        )}
                      </p>
                    )}
                  </li>
                )
              })}
            </ol>

            <div className="mt-3 space-y-1 text-sm">
              {stops.length === 1 ? (
                <p className="rt-no-print text-ink-soft">Add another stop to see distances.</p>
              ) : mappedCount === 0 ? (
                <p className="rt-no-print text-ink-soft">None of these stops are on the map yet, so there are no distances.</p>
              ) : measured.length === 0 ? (
                <p className="rt-no-print text-ink-soft">No distances yet: every leg has a stop that is not on the map yet.</p>
              ) : (
                <>
                  <p className="tabular">
                    Total: approx. {formatMi(shownTotal)} mi <span className="text-ink-soft">(approx. straight-line, not driving distance)</span>
                  </p>
                  {unmeasured > 0 && (
                    <p className="text-xs text-ink-soft">
                      Leaves out {unmeasured} {unmeasured === 1 ? 'leg' : 'legs'} to or from a stop not on the map yet.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="rt-no-print mt-4 flex flex-wrap items-center gap-2">
              {canSuggest && (
                <button type="button" onClick={actions.suggest} className={OUTLINE_BUTTON}>
                  Suggest order
                </button>
              )}
              <button type="button" onClick={copyLink} className={OUTLINE_BUTTON}>
                {/* Both labels share one grid cell, so the button keeps its width and nothing beside it moves. */}
                <span className="grid">
                  <span
                    aria-hidden={copied}
                    className={`col-start-1 row-start-1 transition-opacity duration-150 ease-out ${copied ? 'opacity-0' : ''}`}
                  >
                    Copy trip link
                  </span>
                  <span
                    aria-hidden={!copied}
                    className={`col-start-1 row-start-1 text-center transition-opacity duration-150 ease-out ${copied ? '' : 'opacity-0'}`}
                  >
                    Copied
                  </span>
                </span>
              </button>
              <button type="button" onClick={printTrip} className={OUTLINE_BUTTON}>
                Print trip
              </button>
              <button type="button" onClick={clear} className={OUTLINE_BUTTON}>
                Clear trip
              </button>
            </div>
            <p role="status" aria-live="polite" className="rt-no-print mt-2 min-h-4 text-xs text-ink-soft">
              {copyStatus}
            </p>
          </>
        )}
        <p className="mt-2 text-xs text-ink-soft">{HOURS_DISCLAIMER}</p>
      </div>
    </section>
  )
}
