# Roadtrip: Billy Reid, Build Brief

**Project:** Billy Reid Road Trip (working name), unofficial store guide and trip planner
**Folder:** `C:\roadtrip-billy-reid` (create it, start Claude Code inside it)
**Template (read only, never modified):** `C:\bourbon-guide` (newest map-family code: config-driven map, region zoom, URL state, brands/search)
**Source:** Billy Reid "Our Stores" page (billyreid.com), pasted Nov 5, 2026. Seed data is in `data/stops.json` and `data/map.json`.
**Status (Nov 7, 2026):** Built and deployed on Vercel from main as a noindex prototype: map, list, dropdown filters, trip builder, scroll-driven hero, open-licensed duotone photo, alive pass (load-in, hover, pin-row link, trip animation). In progress: designer pass on the hero.

## 1. Purpose
Help someone plan a drive that hits several Billy Reid stores: see them on a U.S. map, filter by region and experience, pick stops, get an ordered route with approximate distance, and open real directions in their own maps app. Reference-only; no commerce.

## 2. What the source gives us (and doesn't)
**Gives:** 16 physical locations in 10 states + DC (count computed from stops.json), address, hours, and the experiences each offers (Pick Up, Curated Custom Experience, Complete Custom Experience, Complete Collection, Curated Collection), plus one Virtual store.
**Types:** 14 retail (including New York 5th Ave and Washington DC, which the site lists under Custom but does not call showrooms), 1 custom showroom (Los Angeles, Beverly Hills address, limited ready-to-wear stock), 1 outlet (Elmont NY, no experiences listed), plus 1 virtual store (not in stops.json).
**Doesn't give:** phone numbers, coordinates, store-specific URLs, open/closed beyond the hours line.
**Quirks to handle:** the page lists Florence twice (once as "Your Closest Store", a personalization artifact; seeded once); "Los Angeles" is in Beverly Hills; the 5th Ave NYC and DC entries list "Curated Collection" rather than "Complete Collection"; the LA hours line carries an embedded note; hours are in mixed formats.

## 3. Compliance and tone
- Unofficial fan guide, trademark line in footer (see CLAUDE.md). No logos, product or campaign images.
- No selling, affiliate links or reviews. Hours disclaimer on every store card.
- Not alcohol-related, so no 21+ notice here.
- Decision to revisit: using "Billy Reid" in the site title is descriptive use but still their mark. If the brand objects or a partnership is on the table, rename to a neutral title ("Southern Menswear Road Trip") and keep the stores as plain-text facts.

## 4. Data model
Family shape (see bourbon-guide) with these differences:
| Field | Rule |
|---|---|
| mapId | "roadtrip-billy-reid" |
| state | 2-letter state or "DC" |
| storeType | "retail" / "custom-showroom" / "outlet" |
| services | array of experience names exactly as the site writes them |
| groupId, trails, posterNumber | not used |
Every record: sourceUrl (https) + verifiedOn once checked. Virtual store lives in map.json, not stops.json.

## 5. Workflow (office-admin style)
1. **Intake:** seed 16 stores as-is (done: data/stops.json).
2. **Verify (R2):** open each store's own page on billyreid.com; confirm address, hours, services, phone; set the exact `sourceUrl`. Anything the seed got from the pasted list but the store page contradicts is flagged, not silently changed.
3. **Geocode (R3):** Nominatim, accept only inside the right state and matching city.
4. **Build (R1, R4):** scaffold, map, list, trip builder.
5. **QA (R5):** compliance, accessibility, mobile.
6. **Maintain:** re-verify monthly (retail hours change, holiday hours in Nov/Dec especially). Footer shows last verified date. Optional scheduled task to remind you on the 1st.

## 6. Page (v1)
- Hero: kicker, headline, one-line description, stats, computed from stops.json: distinct states, DC counted separately ("16 stores in 10 states and DC").
- U.S. map (state outlines from U.S. Census / us-atlas), pins for stops with lat/lng. Pin shape differs by storeType (round = retail, square = custom showroom, diamond = outlet); the shape plus a number is always visible, never color alone. Region zoom like Bourbon Guide.
- Filter bar: dropdowns only, no text search: State (distinct states, DC included), Region, Experience (the services values), Store type. Each defaults to "All", has a visible label and a 44px native select. "Showing X of N", a Reset button when any filter is active, and URL state (?state=, ?region=, ?experience=, ?type=). Closed stops are never shown.
- List as ledger rows (like Bourbon Guide): city/state, hours, services; expands for address, hours note, website, directions link.
- Trip builder: "Add to trip" on each row and pin. The trip panel shows stops in a suggested order (nearest-neighbor from the stop you pick as start; drag or up/down buttons to reorder), leg distances and total, each labeled "approx. straight-line". "Get directions" links per leg to the visitor's maps app. Trip lives in the URL (?trip=id1,id2,id3) and has a print view.
- Footer: trademark/unofficial line, hours disclaimer, last verified date, Virtual store mention, credits.

## 7. Look
Own look, not Wine & Gold. Dark navy, dark only (no toggle; `color-scheme: dark`, theme-color #0B1626): --page #0B1626, --surface #14253D (land, inputs), --ink #E8EEF7, --ink-soft #A9B6C8, --accent #5B8FD6 (fills, rules and large text only), --accent-text #8DB4EC (links, small text, pins), --ink-hover #FFFFFF (primary button hover), --line #6F86A6 (map state outlines, input borders). Hairlines (--hairline) are ink at 14% opacity. Primary buttons: --ink fill, --page text. Inputs and selects: --surface fill, --ink text, 1px --line border. Map: land --surface, state outlines --line, region boxes and labels --ink-soft; pins --accent-text with a --page number; the selected pin is larger with an --ink fill, a 3px --accent-text ring and the number in --page (shape by store type is kept, so selection never relies on color). On screens 768px and wider the whole-country map is capped at 65% of the column and centred, with the legend and caption directly under it; on phones it is full width, and a zoomed region uses the full column. Print stays light (white, black text, no map fill). Square corners, 1px rules, ledger-style list, dotted leaders. Fonts self-hosted: Fraunces 600 (headings, names), IBM Plex Mono 500 (labels). No logo, brand fonts or images from billyreid.com. Verify WCAG AA for every text/background pair with `npm run check:contrast` and report ratios.

## 7a. Motion
- One signature movement per page: the scroll-driven hero split. The headline halves ease apart on scroll (Billy Reid up-left, Road Trip down-right, about 8 to 12vw, never off-screen), 400 to 700 ms feel, ease-out; the hero image drifts at about 0.85x scroll speed.
- One parallax is allowed, only inside the hero, as part of the scroll-driven split. Transform only, no layout shift, no other parallax anywhere.
- Everything else is small and quick (120 to 200 ms): pin and row hover, pin-row highlight, trip line draw, button easing, a one-time load-in. No cursor-following, autoplay or looping motion.
- Reduced motion, no-JS and print get a static hero that looks complete on its own.

## 8. Out of scope for v1
Accounts, ratings, reviews, product info, pricing, appointment booking, real driving routing (links out only), photos, logos.

## 9. Ideas for later
- Preset trips ("Alabama roots: Florence, Birmingham, Nashville, Atlanta"; "Northeast corridor").
- Add stockists (the site has a Stockists page) as a second layer, if verified.
- Fabric: add this guide as `map_id = roadtrip-billy-reid` in the existing guides database (see FABRIC-SETUP.md); the model fits with `store_type` and `services` as new columns or a `stop_services` table.
- Possible partner: the brand's own team could sponsor or take over the guide; the data model is already clean for a handoff.

## 10. Decisions to make
1. Site name (see section 3).
2. Whether the Outlet and the custom showroom show by default or behind a "store type" filter (recommended: shown, clearly labeled).
3. Whether to add stockists later.
4. Phone hero height. Resolved Nov 7, 2026 (designer pass): the hero fills the first phone screen (100svh) with the headline centred and the truck photo in the lower half; the map follows below.

## 11. Git
Commit after checks pass and push to main. Vercel deploys from main. Never force-push. Never run git in C:\bourbon-guide.
