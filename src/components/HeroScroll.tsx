'use client'

import { useEffect } from 'react'

import {
  HERO_COPY_FADE_START,
  HERO_CUE_HIDE_AT,
  HERO_FADE_END,
  HERO_HEADLINE_FADE_START,
  HERO_HOLD_END,
  HERO_RUNWAY_SVH,
  HERO_SPLIT_END,
} from './heroConfig'

// The one scroll-progress reader for the hero, a passive listener batched with requestAnimationFrame.
// Always (when the effect is on): the first time progress passes HERO_CUE_HIDE_AT it adds .rt-cue-gone to .rt-hero,
// which fades the scroll arrow out and keeps it out for the rest of the visit (scrolling back does not undo it).
// Only in browsers without CSS scroll-driven animations, it also sets custom properties on .rt-hero from the same
// thresholds as heroConfig.ts:
//   --r  0 to 1 over the whole runway (the photo drift)
//   --p  0 to 1 across the headline split (hold, then ease apart)
//   --c  opacity of kicker, paragraph and store count
//   --h  opacity of the headline
// Only scrollY is read per frame; the screen height is read on resize. It does nothing when the effect is off (no
// html.rt-anim: reduced motion or no JS).
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from))

export default function HeroScroll() {
  useEffect(() => {
    if (!document.documentElement.classList.contains('rt-anim')) return
    const drive = !CSS.supports('animation-timeline', 'scroll()')
    const hero = document.querySelector<HTMLElement>('.rt-hero')
    if (!hero) return
    let screen = window.innerHeight
    let frame = 0
    let cueGone = false
    const update = () => {
      frame = 0
      const t = clamp01(window.scrollY / (screen * (HERO_RUNWAY_SVH / 100)))
      if (!cueGone && t > HERO_CUE_HIDE_AT) {
        cueGone = true
        hero.classList.add('rt-cue-gone')
      }
      if (!drive) {
        hero.style.setProperty('--r', t.toFixed(3))
        hero.style.setProperty('--p', span(t, HERO_HOLD_END, HERO_SPLIT_END).toFixed(3))
        hero.style.setProperty('--c', (1 - span(t, HERO_COPY_FADE_START, HERO_FADE_END)).toFixed(3))
        hero.style.setProperty('--h', (1 - span(t, HERO_HEADLINE_FADE_START, HERO_FADE_END)).toFixed(3))
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const resize = () => {
      screen = window.innerHeight
      schedule()
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', resize, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', resize)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return null
}
