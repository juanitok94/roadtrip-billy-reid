import { MAP } from '@/data/types'
import { photoCredits } from '@/lib/images'
import { formatDate, latestVerified } from '@/lib/site'
import { VISITOR_STOPS } from '@/lib/stops'

const UNOFFICIAL =
  "Unofficial fan guide. Not affiliated with or endorsed by Billy Reid. Billy Reid is a trademark of its owner. Hours change; check the store's page before you go."
const VIRTUAL = "Billy Reid also offers a virtual appointment: see the store's site."

// Everything but the two fixed lines is computed from the data at build time.
export default function SiteFooter() {
  const latest = latestVerified(VISITOR_STOPS)
  return (
    <footer className="mx-auto mt-12 max-w-5xl px-4 pb-8">
      <div className="rt-ruled space-y-2 pt-5 text-xs leading-relaxed text-ink-soft">
        <p className="text-ink">{UNOFFICIAL}</p>
        {/* "Print trip" keeps only the unofficial line above. */}
        <p className="rt-no-print tabular">{latest ? `Last verified: ${formatDate(latest)}` : 'Stores not yet verified'}</p>
        {MAP.virtualStore && <p className="rt-no-print">{VIRTUAL}</p>}
        {photoCredits().map((c) => (
          <p key={c} className="rt-no-print">
            {c}
          </p>
        ))}
        {MAP.credits.map((c) => (
          <p key={c} className="rt-no-print">
            {c}
          </p>
        ))}
      </div>
    </footer>
  )
}
