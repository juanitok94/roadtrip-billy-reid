import Duotone from '@/components/Duotone'
import Explorer from '@/components/Explorer'
import HeroScroll from '@/components/HeroScroll'
import { heroCssVars } from '@/components/heroConfig'
import { MAP } from '@/data/types'
import { computeLayout } from '@/lib/map-layout'
import { homeJsonLd, SEO_DESCRIPTION, storeStats } from '@/lib/site'
import { VISITOR_STOPS } from '@/lib/stops'

// Each word in its own box for the load-in (html.rt-intro). The halves around them carry the scroll effect, so the two
// never animate the same element.
function Words({ text, from }: { text: string; from: number }) {
  return text
    .split(' ')
    .filter(Boolean)
    .map((w, i) => (
      <span key={i}>
        {i > 0 && ' '}
        <span className="rt-word" style={{ '--w': from + i } as React.CSSProperties}>
          {w}
        </span>
      </span>
    ))
}

export default function Home() {
  const entries = VISITOR_STOPS
  const layout = computeLayout(entries)
  // "Billy Reid" / "Road Trip": the last two words of the title drop to the second line.
  const words = MAP.title.split(' ')
  const titleTop = words.length > 2 ? words.slice(0, -2).join(' ') : MAP.title
  const titleBottom = words.length > 2 ? words.slice(-2).join(' ') : ''
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: homeJsonLd(entries) }} />
      {/* The hero fills the first screen: centred text on navy above, the photo full-bleed below. See .rt-hero in
          globals.css for the scroll move (the halves part, the photo drifts) and the static version. */}
      <header className="rt-no-print rt-hero" style={heroCssVars}>
        <div className="rt-hero-frame">
        <div className="rt-hero-text mx-auto w-full max-w-5xl px-4 text-center">
          <p className="rt-hero-kicker text-[11px] leading-snug tracking-[0.18em] text-accent-text">{MAP.kicker}</p>
          {/* The full title stays the accessible name; the two halves are decoration for the scroll effect. */}
          <h1 aria-label={MAP.title} className="rt-hero-h1 font-serif font-semibold">
            <span aria-hidden="true" className="rt-hero-a">
              <Words text={titleTop} from={0} />
            </span>{' '}
            <span aria-hidden="true" className="rt-hero-b">
              <Words text={titleBottom} from={titleTop.split(' ').length} />
            </span>
          </h1>
          <div className="rt-hero-copy">
            <p className="rt-hero-lede mx-auto max-w-xl text-sm leading-relaxed">{SEO_DESCRIPTION}</p>
            <p className="tabular mt-2 text-xs text-ink-soft">{storeStats(entries)}</p>
          </div>
        </div>
        <div aria-hidden="true" className="rt-hero-media">
          <div className="rt-hero-drift">
            <Duotone id="road-hero" width={1800} height={1319} />
          </div>
          <p className="rt-scroll-cue">Scroll</p>
        </div>
        </div>
        <HeroScroll />
      </header>
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <Explorer entries={entries} layout={layout} />
      </div>
    </main>
  )
}
