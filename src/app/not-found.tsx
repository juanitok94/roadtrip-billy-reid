import type { Metadata } from 'next'
import Link from 'next/link'
import ErrorScreen, { PRIMARY } from '@/components/ErrorScreen'
import { MAP } from '@/data/types'

export const metadata: Metadata = {
  title: `Not found | ${MAP.title}`,
}

export default function NotFound() {
  return (
    <ErrorScreen label="404" headline="That page isn't on the map." image={{ id: 'road-404', width: 1600, height: 994 }}>
      <Link href="/" className={PRIMARY}>
        Back to the guide
      </Link>
    </ErrorScreen>
  )
}
