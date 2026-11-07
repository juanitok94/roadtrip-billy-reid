'use client'

import { useEffect } from 'react'

// Fallback for browsers without CSS scroll-driven animations. A passive scroll listener, batched with
// requestAnimationFrame, sets two custom properties on .rt-hero and the CSS does the rest:
//   --p  0 to 1 over the first half screen of scroll (the headline halves part, with a 500ms ease-out transition)
//   --y  the scroll offset in px, capped at one screen (the photo layer drifts by 0.15 of it: 0.85x scroll speed)
// Only scrollY is read per frame; the screen height is read on resize. It does nothing when the effect is off (no
// html.rt-anim: reduced motion or no JS) or when the browser animates by itself.
export default function HeroScroll() {
  useEffect(() => {
    if (!document.documentElement.classList.contains('rt-anim')) return
    if (CSS.supports('animation-timeline', 'scroll()')) return
    const hero = document.querySelector<HTMLElement>('.rt-hero')
    if (!hero) return
    let screen = window.innerHeight
    let frame = 0
    const update = () => {
      frame = 0
      const y = Math.min(screen, Math.max(0, window.scrollY))
      hero.style.setProperty('--p', Math.min(1, y / (screen * 0.5)).toFixed(3))
      hero.style.setProperty('--y', `${y.toFixed(1)}px`)
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
