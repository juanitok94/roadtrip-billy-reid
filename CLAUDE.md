# CLAUDE.md: Billy Reid Road Trip (unofficial)

## Purpose
A static, map-first guide for planning a road trip through Billy Reid's retail stores. Map of the U.S. with store pins, a full list, filters, and a trip builder that orders chosen stops and estimates straight-line distance. Part of the "map family" (see NC Distillery Guide, Bourbon Guide).

## Rules (non-negotiable)
- Every fact has a sourceUrl (https) and verifiedOn date. Unverified = null. Never guess.
- Sources: billyreid.com only (Our Stores page, store pages). No directories, Yelp, Google summaries, memory.
- Unofficial. Footer text: "Unofficial fan guide. Not affiliated with or endorsed by Billy Reid. Billy Reid is a trademark of its owner. Hours change; check the store's page before you go."
- No logos, wordmark artwork, product, lookbook or campaign images. Name as plain text only.
- No selling, affiliate links, ratings, reviews, prices, accounts, analytics.
- No staff names.
- Visit/route language only.

## Data
- src/data/map.json and src/data/stops.json (family shape). Extra fields here: storeType ("retail" | "custom-showroom" | "outlet"), services (array of the store's listed experiences).
- The Virtual store lives in map.json.virtualStore, never on the map.
- Closed or removed stores stay in the data with status "closed" but are never shown to visitors.
- check:data: unique ids, valid status, region in map.json, https sourceUrl once verifiedOn is set, storeType valid. Warn on null lat/lng.
- Update flow: edit JSON, run check:data, build.

## Technical
Next.js App Router, TypeScript, Tailwind, output "export". No API routes or server actions. Scripts: dev, build, lint, tsc, check:data, geocode. Fonts self-hosted (@fontsource).

## Accessibility
44px targets, visible focus rings, aria-pressed on toggles, aria-expanded on disclosures, prefers-reduced-motion, no color-only cues, list is the accessible alternative to the map, one h1, no horizontal scroll at 320px.

## Look
Navy palette, tokens defined once in src/app/globals.css: page #F5F7FA, surface #E2E8F0, ink #0F1B2D, ink-soft #4A5568, accent #2F5D9B (fills, rules, large text only), accent-text #1F3A5F (links, small text, pins), on-dark #FFFFFF, ink-hover #1E2D45. Hairlines are ink at 10%. Primary buttons ink fill, white text. Selected pin: larger, --page fill, 3px accent-text ring, number in accent-text; shape by store type is kept. Square corners, 1px rules, no shadows. No hard-coded colors outside globals.css and icon.svg. Run `npm run check:contrast` after any color change. No brand logo, fonts or images.

## Distances
Straight-line (haversine) only, always labeled "approx. straight-line". Real driving directions open in the visitor's own maps app via a link built from the store address.

## Git
Commit locally when asked. Push only when the user does it.
