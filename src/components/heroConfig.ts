// Hero scroll tuning. Retune here; page.tsx hands these to the CSS as custom properties on .rt-hero and HeroScroll.tsx
// (the fallback for browsers without scroll-driven animations) reads the same numbers. Progress is 0 to 1 over the
// runway. (Kept out of HeroScroll.tsx because that file is a client component and the page, a server component,
// needs the values too.)

/** Scroll distance the hero stays pinned for, in svh. The map starts right after it. */
export const HERO_RUNWAY_SVH = 140
/** The headline holds still until here. */
export const HERO_HOLD_END = 0.25
/** The headline halves finish easing apart here. */
export const HERO_SPLIT_END = 0.7
/** Kicker, paragraph and store count start fading here (after the headline has started moving). */
export const HERO_COPY_FADE_START = 0.4
/** The headline stays fully opaque until here, then fades. */
export const HERO_HEADLINE_FADE_START = 0.6
/** Everything has finished fading here. */
export const HERO_FADE_END = 0.9

export const heroCssVars = {
  '--rt-runway': `${HERO_RUNWAY_SVH}svh`,
  '--rt-hold': HERO_HOLD_END,
  '--rt-split-end': HERO_SPLIT_END,
  '--rt-copy-start': HERO_COPY_FADE_START,
  '--rt-head-start': HERO_HEADLINE_FADE_START,
  '--rt-fade-end': HERO_FADE_END,
} as Record<string, string | number>
