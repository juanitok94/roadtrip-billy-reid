# Billy Reid Road Trip

An unofficial, map-first guide to Billy Reid's stores. Static Next.js site, config-driven from `src/data/map.json`,
records in `src/data/stops.json`. `data/` holds the original seed files.

```bash
npm install
npm run dev             # http://localhost:3000
npm run check:data      # validates the data (--verbose lists every warning); also runs before every build
npm run check:contrast  # prints the WCAG ratio of every text and graphic colour pair
npm run geocode         # fills lat/lng from OpenStreetMap Nominatim (-- --dry to preview)
npm run build           # static export to out/
```

Unofficial fan guide. Not affiliated with or endorsed by Billy Reid. Billy Reid is a trademark of its owner.
