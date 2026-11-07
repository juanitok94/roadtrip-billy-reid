// Open-licensed photographs. Every file in public/images has a record in src/data/images.json (check:data enforces it).
import records from '../data/images.json'

export type ImageRecord = {
  id: string
  file: string
  title: string
  alt: string
  creator: string
  dateCreated: string
  location: string
  collection: string
  callNumber: string
  sourceUrl: string // https
  rightsStatement: string // the source's rights line, verbatim
  license: string
  verifiedOn: string // YYYY-MM-DD
  usedOn: string[]
}

export const ALLOWED_LICENSES = ['Public Domain', 'CC0']
export const IMAGES: ImageRecord[] = records

export const imageById = (id: string): ImageRecord => {
  const r = IMAGES.find((i) => i.id === id)
  if (!r) throw new Error(`images.json has no record "${id}"`)
  return r
}

// "Photo: Dorothea Lange, Nyssa Heights, Oregon, 1939. Library of Congress, FSA/OWI. No known restrictions."
// One line per photograph, even when it is cropped more than once.
export function photoCredits(): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of IMAGES) {
    if (seen.has(r.sourceUrl)) continue
    seen.add(r.sourceUrl)
    const year = r.dateCreated.match(/\d{4}/)?.[0] ?? r.dateCreated
    const rights = r.rightsStatement.split(/(?<=\.)\s/)[0]
    out.push(`Photo: ${r.creator}, ${r.location}, ${year}. ${r.collection}. ${rights}`)
  }
  return out
}
