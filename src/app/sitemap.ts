import type { MetadataRoute } from 'next'
import { INDEXABLE, latestVerified, SITE_URL } from '@/lib/site'
import { VISITOR_STOPS } from '@/lib/stops'

export const dynamic = 'force-static'

// One page. Empty (no URLs) during the prototype phase, and until NEXT_PUBLIC_SITE_URL is set, since a sitemap needs
// absolute URLs. A static export always writes the file; robots.txt only points to it once the site is indexable.
export default function sitemap(): MetadataRoute.Sitemap {
  if (!INDEXABLE || !SITE_URL) return []
  const latest = latestVerified(VISITOR_STOPS)
  return [{ url: `${SITE_URL}/`, ...(latest ? { lastModified: latest } : {}) }]
}
