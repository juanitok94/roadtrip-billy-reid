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
Dark navy only, no toggle (`color-scheme: dark`, theme-color #0B1626). Tokens defined once in src/app/globals.css: page #0B1626, surface #14253D, ink #E8EEF7, ink-soft #A9B6C8, accent #5B8FD6 (fills, rules, large text only), accent-text #8DB4EC (links, small text, pins), ink-hover #FFFFFF, line #6F86A6 (map state outlines, input borders). Hairlines are ink at 14%. Primary buttons ink fill, page text. Inputs and selects: surface fill, ink text, 1px line border. Pins: accent-text fill, page number. Selected pin: larger, --ink fill, 3px accent-text ring, number in --page; shape by store type is kept. Whole-country map is capped at 65% of the column from 768px up (full width on phones and when zoomed). Print stays light. Square corners, 1px rules, no shadows. No hard-coded colors outside globals.css and icon.svg (map.json accent and themeColor mirror --accent-text and --page; check:data enforces it). Run `npm run check:contrast` after any color change. No brand logo, fonts or images.

## Distances
Straight-line (haversine) only, always labeled "approx. straight-line". Real driving directions open in the visitor's own maps app via a link built from the store address.

## Git
Commit locally when asked. Push only when the user does it.
