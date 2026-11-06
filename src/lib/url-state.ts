// The filters live in the URL (?region=&experience=&type=&q=), so a filtered view can be shared. Pure helpers, plus
// the URL as an external store for useSyncExternalStore. Unknown values fall back to "all" where they are used.
export const ALL = 'all'

export type FilterParam = 'region' | 'experience' | 'type' | 'q'

export function readParam(search: string, name: FilterParam): string | null {
  try {
    return new URLSearchParams(search).get(name)
  } catch {
    return null
  }
}

// Returns the value if it is one of the choices, else "all".
export function parseChoice(search: string, name: FilterParam, choices: readonly string[]): string {
  const raw = readParam(search, name)
  return raw !== null && choices.includes(raw) ? raw : ALL
}

// Empty or "all" removes the parameter. Nothing notifies until notifyUrl, so several writes count as one change.
export function writeParam(name: FilterParam, value: string): void {
  try {
    const url = new URL(window.location.href)
    if (value === '' || value === ALL) url.searchParams.delete(name)
    else url.searchParams.set(name, value)
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url.href)
  } catch {
    // History API unavailable (sandboxed frame): the address bar just doesn't change.
  }
}

// Back/forward (popstate) and our own replaceState calls (a custom event, since replaceState fires none) re-read it.
const URL_EVENT = 'filters-url-change'
export function subscribeToUrl(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  window.addEventListener(URL_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(URL_EVENT, onChange)
  }
}
export const readSearch = (): string => window.location.search
export const notifyUrl = (): void => {
  window.dispatchEvent(new Event(URL_EVENT))
}
