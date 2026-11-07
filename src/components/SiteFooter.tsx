const UNOFFICIAL =
  "Unofficial fan guide. Not affiliated with or endorsed by Billy Reid. Billy Reid is a trademark of its owner. Hours change; check the store's page before you go."

// The unofficial line only. Image, map and location credits live in the data files (images.json, geocodeSource,
// map.json credits), not on the page.
export default function SiteFooter() {
  return (
    <footer className="mx-auto mt-12 max-w-5xl px-4 pb-8">
      <div className="rt-ruled pt-5 text-center text-xs leading-relaxed text-ink">
        <p>{UNOFFICIAL}</p>
      </div>
    </footer>
  )
}
