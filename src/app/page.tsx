import Explorer from '@/components/Explorer'
import { MAP } from '@/data/types'
import { computeLayout } from '@/lib/map-layout'
import { homeJsonLd, SEO_DESCRIPTION, storeStats } from '@/lib/site'
import { VISITOR_STOPS } from '@/lib/stops'

export default function Home() {
  const entries = VISITOR_STOPS
  const layout = computeLayout(entries)
  return (
    <main className="mx-auto max-w-5xl px-4 pt-8 md:pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: homeJsonLd(entries) }} />
      <header>
        <p className="text-[11px] leading-snug tracking-[0.18em] text-rust">{MAP.kicker}</p>
        <h1 className="mt-3 font-serif text-[42px] leading-[1.02] font-semibold tracking-tight md:text-7xl">{MAP.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed">{SEO_DESCRIPTION}</p>
        <p className="tabular mt-3 text-xs text-slate">{storeStats(entries)}</p>
      </header>
      <div className="mt-6">
        <Explorer entries={entries} layout={layout} />
      </div>
    </main>
  )
}
