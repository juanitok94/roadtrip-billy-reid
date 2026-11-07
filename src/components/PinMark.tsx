// One mark for every place a stop appears: circle = retail store, square = custom showroom, diamond = outlet, with
// the stop's list number inside. Shape and number carry the meaning, so colour is never the only cue.
import type { SVGProps } from 'react'
import { padNumber } from '@/lib/stops'
import type { StoreType } from '@/data/types'

const SELECTED_SCALE = 1.2 // the selected pin is larger, so size is a cue as well as colour
const SIZE = 13 // half the circle's width; the other shapes are sized to look the same weight and hold two digits

export function pinShape(type: StoreType, half: number, props: SVGProps<SVGElement>) {
  if (type === 'custom-showroom') {
    const s = half * 0.9
    return <rect x={-s} y={-s} width={s * 2} height={s * 2} {...(props as SVGProps<SVGRectElement>)} />
  }
  if (type === 'outlet') {
    const s = half * 1.28
    return <polygon points={`0,${-s} ${s},0 0,${s} ${-s},0`} {...(props as SVGProps<SVGPolygonElement>)} />
  }
  return <circle r={half} {...(props as SVGProps<SVGCircleElement>)} />
}

// Goes inside an <svg>, centred on 0,0.
export function PinMark({ type, number, active }: { type: StoreType; number: number; active: boolean }) {
  return (
    <>
      {active
        ? pinShape(type, SIZE * SELECTED_SCALE, { fill: 'var(--ink)', stroke: 'var(--accent-text)', strokeWidth: 3 })
        : pinShape(type, SIZE, { fill: 'var(--accent-text)', stroke: 'var(--page)', strokeWidth: 1.5 })}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fill="var(--page)"
        style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}
      >
        {padNumber(number)}
      </text>
    </>
  )
}

// A pin on the trip carries its order in a small square at its top right, outlined in --page so it reads on any pin.
// `pop`: it scales in over 150ms (the stop was just added).
export function TripBadge({ n, pop = false }: { n: number; pop?: boolean }) {
  const w = n > 9 ? 18 : 14
  return (
    <g transform={`translate(${SIZE - 1} ${-SIZE - 3})`}>
      <g className={pop ? 'rt-pop' : undefined}>
        <rect x={-w / 2} y={-7} width={w} height={14} fill="var(--ink)" stroke="var(--page)" strokeWidth="1.5" />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="10"
          fill="var(--page)"
          style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}
        >
          {n}
        </text>
      </g>
    </g>
  )
}

export const PIN_RING = SIZE + 5
export const PIN_RING_SELECTED = SIZE * SELECTED_SCALE + 5 // clear of the selected pin's 3px edge

// The mark on its own, for a ledger row. Decorative there: the row says the number and the store type in text.
export function RowMark({ type, number, active }: { type: StoreType; number: number; active: boolean }) {
  return (
    <svg viewBox="-18 -18 36 36" width="36" height="36" aria-hidden="true" className="block shrink-0 overflow-visible">
      <PinMark type={type} number={number} active={active} />
    </svg>
  )
}

// A small empty shape for the map key.
export function KeyMark({ type }: { type: StoreType }) {
  return (
    <svg viewBox="-9 -9 18 18" width="18" height="18" aria-hidden="true" className="block shrink-0">
      {pinShape(type, 6, { fill: 'var(--accent-text)' })}
    </svg>
  )
}
