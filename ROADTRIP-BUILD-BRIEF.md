# Roadtrip: Billy Reid, Build Brief

**Project:** Billy Reid Road Trip (working name), unofficial store guide and trip planner
**Folder:** `C:\roadtrip-billy-reid` (create it, start Claude Code inside it)
**Template (read only, never modified):** `C:\bourbon-guide` (newest map-family code: config-driven map, region zoom, URL state, brands/search)
**Source:** Billy Reid "Our Stores" page (billyreid.com), pasted Nov 5, 2026. Seed data is in `data/stops.json` and `data/map.json`.
**Status:** Planning. Prompts R1 to R5 in ROADTRIP-CC-PROMPTS.md.

## 1. Purpose
Help someone plan a drive that hits several Billy Reid stores: see them on a U.S. map, filter by region and experience, pick stops, get an ordered route with approximate distance, and open real directions in their own maps app. Reference-only; no commerce.

## 2. What the source gives us (and doesn't)
**Gives:** 16 physical locations in 13 states + DC, address, hours, and the experiences each offers (Pick Up, Curated Custom Experience, Complete Custom Experience, Complete Collection, Curated Collection), plus one Virtual store.
**Types:** 13 regular retail, 1 custom showroom (Los Angeles, Beverly Hills address, limited ready-to-wear stock), 1 outlet (Elmont NY, no experiences listed), 1 virtual.
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
- Hero: kicker, headline, one-line description, stats ("16 stores in 13 states and DC").
- U.S. map (state outlines from U.S. Census / us-atlas), pins for stops with lat/lng. Pin shape differs by storeType (round = retail, square = custom showroom, diamond = outlet); the shape plus a number is always visible, never color alone. Region zoom like Bourbon Guide.
- Filter bar: search (city, state, address), Region, Experience (the services values), Store type.
- List as ledger rows (like Bourbon Guide): city/state, hours, services; expands for address, hours note, website, directions link.
- Trip builder: "Add to trip" on each row and pin. The trip panel shows stops in a suggested order (nearest-neighbor from the stop you pick as start; drag or up/down buttons to reorder), leg distances and total, each labeled "approx. straight-line". "Get directions" links per leg to the visitor's maps app. Trip lives in the URL (?trip=id1,id2,id3) and has a print view.
- Footer: trademark/unofficial line, hours disclaimer, last verified date, Virtual store mention, credits.

## 7. Look
Own look, not Wine & Gold. Navy palette: --page #F5F7FA, --surface #E2E8F0 (land), --ink #0F1B2D, --ink-soft #4A5568, --accent #2F5D9B (fills, rules and large text only), --accent-text #1F3A5F (links, small text, pins), --on-dark #FFFFFF, --ink-hover #1E2D45 (primary button hover). Hairlines are ink at 10% opacity. Primary buttons: --ink fill, white text. Pins: --accent-text with a white number; the selected pin is larger with a --page fill, a 3px --accent-text ring and the number in --accent-text (shape by store type is kept, so selection never relies on color). Square corners, 1px rules, ledger-style list, dotted leaders. Fonts self-hosted: Fraunces 600 (headings, names), IBM Plex Mono 500 (labels). No logo, brand fonts or images from billyreid.com. Verify WCAG AA for every text/background pair with `npm run check:contrast` and report ratios.

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
