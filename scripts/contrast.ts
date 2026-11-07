// WCAG contrast for the colour tokens, read from globals.css (the one place they are defined).
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
    pairOf(t, '--ink', '--page', 'body, headline, row names'),
    pairOf(t, '--ink', '--surface', 'input and select text'),
    pairOf(t, '--ink-soft', '--page', 'hours, service labels, footer, hints'),
    pairOf(t, '--ink-soft', '--surface', 'region labels over the land, placeholder text'),
    pairOf(t, '--accent-text', '--page', 'kicker, section label, chevrons'),
    pairOf(t, '--accent-text', '--surface', 'chevrons in inputs'),
    pairOf(t, '--page', '--ink', 'primary buttons, selected pin number'),
    pairOf(t, '--page', '--ink-hover', 'hovered primary button'),
    pairOf(t, '--page', '--accent-text', 'pin numbers'),
    pairOf(t, '--cream', '--page', 'cream type'),
    pairOf(t, '--cream', '--surface', 'cream type on a surface'),
  ]
}

// Graphics that must stand out from what is next to them. Needs 3:1.
export function graphicPairs(t: Tokens): Pair[] {
  return [
    pairOf(t, '--line', '--surface', 'state outlines against the land; input borders'),
    pairOf(t, '--line', '--page', 'state outlines at the coast; input borders on the page'),
    pairOf(t, '--ink', '--page', 'secondary button borders'),
    pairOf(t, '--ink', '--surface', 'leaders, selected pin fill on the land'),
    pairOf(t, '--ink-soft', '--page', 'region boxes at the coast, row hover bar'),
    pairOf(t, '--ink-soft', '--surface', 'region boxes over the land'),
    pairOf(t, '--accent-text', '--page', 'focus ring, selected row bar'),
    pairOf(t, '--accent-text', '--surface', 'pins, selected pin ring, focus ring on a region'),
  ]
}

// Pairs no text or meaningful graphic relies on, listed so nobody reaches for them. Reported, not enforced.
export function unusedPairs(t: Tokens): Pair[] {
  return [
    pairOf(t, '--accent', '--page', 'decorative ledger and footer rules only; large text would need 3:1'),
    pairOf(t, '--accent', '--surface', 'not used'),
    pairOf(t, '--page', '--accent', 'not used; any text on an accent fill must be --page'),
    pairOf(t, '--surface', '--page', 'land against the page; the state lines carry the edge'),
  ]
}

// A translucent ink token composited over a background, as it renders. For reporting hairlines.
function overInk(bg: string, ink: string, alpha: number): string {
  const channel = (i: number) => Math.round(parseInt(bg.slice(i, i + 2), 16) * (1 - alpha) + parseInt(ink.slice(i, i + 2), 16) * alpha)
  return `#${[1, 3, 5].map((i) => channel(i).toString(16).padStart(2, '0')).join('')}`
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
  const hairline = overInk(t['--page'], t['--ink'], 0.14)
  console.log(`${contrast(hairline, t['--page']).toFixed(2).padStart(6)}:1  --hairline on --page (decorative separators only)  ${hairline} / ${t['--page']}`)
  if (failed) process.exit(1)
}
