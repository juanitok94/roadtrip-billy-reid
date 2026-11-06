// WCAG contrast for the Heritage Indigo tokens, read from globals.css (the one place they are defined).
// Run: npm run check:contrast. check:data fails on the same pairs.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export type Tokens = Record<string, string>
export type Pair = { name: string; fg: string; bg: string }

// Every `--name: #rrggbb;` in globals.css's :root block.
export function readTokens(): Tokens {
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
  const root = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? ''
  return Object.fromEntries([...root.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]))
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const pairOf = (t: Tokens, fg: string, bg: string, why: string): Pair => ({ name: `${fg} on ${bg} (${why})`, fg: t[fg], bg: t[bg] })

// Text and the background it actually sits on. Needs 4.5:1.
export function textPairs(t: Tokens): Pair[] {
  return [
    pairOf(t, '--indigo', '--cream', 'body, headline, row names, controls, map labels'),
    pairOf(t, '--slate', '--cream', 'hours, service labels, footer, hints, placeholder'),
    pairOf(t, '--rust', '--cream', 'kicker, section label'),
    pairOf(t, '--cream', '--indigo', 'pin numbers, hovered buttons'),
    pairOf(t, '--cream', '--rust', 'selected pin number, hovered primary button'),
  ]
}

// Graphics that must stand out from what is next to them. Needs 3:1.
export function graphicPairs(t: Tokens): Pair[] {
  return [
    pairOf(t, '--indigo', '--cream', 'pins, control borders, map frame, ledger rule'),
    pairOf(t, '--slate', '--cream', 'state lines, dotted rules, label borders'),
    pairOf(t, '--rust', '--cream', 'focus ring, selected pin, chevrons'),
  ]
}

// Pairs that would fail, listed so nobody reaches for them. They appear nowhere on the page.
export function unusedPairs(t: Tokens): Pair[] {
  return [pairOf(t, '--rust', '--indigo', 'not used; hover and active states never put the two together')]
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const t = readTokens()
  let failed = 0
  const line = (p: Pair, min: number) => {
    const c = contrast(p.fg, p.bg)
    if (c < min) failed++
    console.log(`${c.toFixed(2).padStart(6)}:1  ${c >= min ? 'pass' : 'FAIL'} (${min}:1)  ${p.name}  ${p.fg} / ${p.bg}`)
  }
  console.log('Text')
  textPairs(t).forEach((p) => line(p, 4.5))
  console.log('Graphics')
  graphicPairs(t).forEach((p) => line(p, 3))
  console.log('Not used')
  unusedPairs(t).forEach((p) => console.log(`${contrast(p.fg, p.bg).toFixed(2).padStart(6)}:1  ${p.name}  ${p.fg} / ${p.bg}`))
  if (failed) process.exit(1)
}
