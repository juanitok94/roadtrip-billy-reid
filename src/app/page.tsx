import Duotone from '@/components/Duotone'
import Explorer from '@/components/Explorer'
import HeroScroll from '@/components/HeroScroll'
import { MAP } from '@/data/types'
import { computeLayout } from '@/lib/map-layout'
import { homeJsonLd, SEO_DESCRIPTION, storeStats } from '@/lib/site'
import { VISITOR_STOPS } from '@/lib/stops'

export default function Home() {
  const entries = VISITOR_STOPS
  const layout = computeLayout(entries)
  // "Billy Reid" / "Road Trip": the last two words of the title drop to the second line.
  const words = MAP.title.split(' ')
  const titleTop = words.length > 2 ? words.slice(0, -2).join(' ') : MAP.title
  const titleBottom = words.length > 2 ? words.slice(-2).join(' ') : ''
  return (
    <main className="mx-auto max-w-5xl px-4 pt-4 md:pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: homeJsonLd(entries) }} />
      <header className="rt-no-print rt-hero">
        <div className="rt-hero-stage">
          <p className="text-[11px] leading-snug tracking-[0.18em] text-accent-text">{MAP.kicker}</p>
          <div className="rt-hero-title">
            {/* The full title stays the accessible name; the two halves are decoration for the scroll effect. */}
            <h1 aria-label={MAP.title} className="mt-3 font-serif text-[42px] leading-[1.02] font-semibold tracking-tight md:text-7xl">
              <span aria-hidden="true" className="rt-hero-a">
                {titleTop}
              </span>{' '}
              <span aria-hidden="true" className="rt-hero-b">
                {titleBottom}
              </span>
            </h1>
            <Duotone id="road-hero" width={1600} height={535} className="rt-hero-img" />
          </div>
          <div className="rt-hero-swap">
            <div className="rt-hero-copy">
              <p className="mt-3 max-w-2xl text-sm leading-normal md:mt-4 md:leading-relaxed">{SEO_DESCRIPTION}</p>
              <p className="tabular mt-3 text-xs text-ink-soft">{storeStats(entries)}</p>
            </div>
            <ul aria-hidden="true" className="rt-hero-prompts">
              <li>Pick a state</li>
              <li>Plot a route</li>
              <li>Add a stop</li>
            </ul>
          </div>
        </div>
        <div aria-hidden="true" className="rt-hero-spacer" />
        <HeroScroll />
      </header>
      <div className="mt-6">
        <Explorer entries={entries} layout={layout} />
      </div>
    </main>
  )
}
