# CLAUDE.md: Billy Reid Road Trip (unofficial)

## Purpose
A static, map-first guide for planning a road trip through Billy Reid's retail stores. Map of the U.S. with store pins, a full list, dropdown filters, and a trip builder that orders chosen stops and estimates straight-line distance. Part of the "map family" (see NC Distillery Guide, Bourbon Guide).

## Rules (non-negotiable)
- Every fact has a sourceUrl (https) and verifiedOn date. Unverified = null. Never guess.
- Sources for store facts: billyreid.com only (locations page and each store's own page). No directories, Yelp, Google summaries, memory.
- Unofficial. Footer text: "Unofficial fan guide. Not affiliated with or endorsed by Billy Reid. Billy Reid is a trademark of its owner. Hours change; check the store's page before you go."
- No Billy Reid logos, wordmark artwork, product, lookbook or campaign images, and no imagery from billyreid.com. Name as plain text only.
- Images come only from src/data/images.json (Public Domain or CC0). No recognizable faces, readable business signs or hardship scenes. Credit the real place and photographer in the footer. Images are texture (hero, 404), never next to a store row.
- No selling, affiliate links, ratings, reviews, prices, accounts, analytics.
- No staff names.
- Visit/route language only.

## Data
- src/data/map.json, src/data/stops.json (family shape) and src/data/images.json. Extra fields here: storeType ("retail" | "custom-showroom" | "outlet"), services (array of the store's listed experiences).
- storeType rule: "custom-showroom" only when the store's own page says so (today: Los Angeles). "outlet" only for the outlet page. Everything else is "retail"; put site-view quirks in the note field.
- The Virtual store lives in map.json.virtualStore, never on the map.
- Closed or removed stores stay in the data with status "closed" but are never shown to visitors.
- Stats shown on the page (store count, state count) are computed from the data, never hard-coded.
- check:data: unique ids, valid status, region in map.json, https sourceUrl once verifiedOn is set, storeType valid, every file in public/images has an images.json record with an allowed license and https sourceUrl. Warn on null lat/lng.
- Coordinates: from Nominatim (or a billyreid.com map link), recorded with geocodeSource. Never invent; a road midpoint is not a store location.
- Update flow: edit JSON, run check:data, build.

## Technical
Next.js App Router, TypeScript, Tailwind, output "export". No API routes or server actions. Scripts: dev, build, lint, tsc, check:data, geocode. Fonts self-hosted (@fontsource). Filters are native <select> dropdowns only (State, Region, Experience, Store type), no text search; URL state ?state= ?region= ?experience= ?type= ?trip=.
Prototype phase: noindex (robots meta, robots.txt disallow, no sitemap) unless NEXT_PUBLIC_INDEXABLE=true.

## Look and motion
- Dark navy theme; the CSS tokens in the repo are the source of truth. Serif headings (Fraunces), calm sans/mono UI, hairline borders, generous whitespace, no gradients or heavy shadows. Warm cream token for duotone highlights and type.
- One signature movement per page (the scroll-driven hero split). Everything else is tiny and quick: 120 to 200 ms hovers, 400 to 700 ms for the signature move, ease-out, nothing bounces. Transform and opacity only, no layout shift.
- Allowed small responses: pin and row hover, pin-row highlight, trip line draw, button easing, one-time load-in. Not allowed: parallax, cursor-following, autoplay, looping ambient motion, moving the filters or the map frame.
- Reduced motion, no-JS and print get a static version. Hover effects only under (hover: hover).
- All images use the same navy and cream duotone.

## Accessibility
44px targets, visible focus rings, aria-pressed on toggles, aria-expanded on disclosures, prefers-reduced-motion, no color-only cues, list is the accessible alternative to the map, one h1, no horizontal scroll at 320px. Check 320, 375, 768 and 1280px by viewing, not only by measuring.

## Distances
Straight-line (haversine) only, always labeled "approx. straight-line". Real driving directions open in the visitor's own maps app via a link built from the store address.

## Git
Commit after checks pass and push to main. Vercel deploys from main. Never force-push. Never run git in C:\bourbon-guide.