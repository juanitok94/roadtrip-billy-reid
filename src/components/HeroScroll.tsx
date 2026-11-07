'use client'

import { useEffect } from 'react'

// Fallback for browsers without CSS scroll-driven animations: a passive scroll listener, batched with
// requestAnimationFrame, sets --p (0 to 1) on .rt-hero over the first 56vh of scroll (--rt-run). The CSS does the rest. It does
// nothing when the effect is off (no html.rt-anim: reduced motion) or when the browser animates by itself.
export default function HeroScroll() {
  useEffect(() => {
    if (!document.documentElement.classList.contains('rt-anim')) return
    if (CSS.supports('animation-timeline', 'scroll()')) return
    const hero = document.querySelector<HTMLElement>('.rt-hero')
    if (!hero) return
    let frame = 0
    const update = () => {
      frame = 0
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.56)))
      hero.style.setProperty('--p', p.toFixed(3))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return null
}
