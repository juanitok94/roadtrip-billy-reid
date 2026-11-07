import type { ReactNode } from 'react'
import Duotone from '@/components/Duotone'

// Shared layout for the 404 and error pages. The footer comes from the layout (global-error adds its own, since it
// runs without the layout).
export default function ErrorScreen({
  label,
  headline,
  body,
  image,
  children,
}: {
  label: string
  headline: string
  body?: string
  image?: { id: string; width: number; height: number } // decorative photo above the label
  children: ReactNode // the action buttons
}) {
  return (
    <main className="mx-auto min-h-[60vh] max-w-md px-4 py-12 text-center">
      {image && <Duotone id={image.id} width={image.width} height={image.height} className="mb-8" />}
      <p className="text-xs tracking-[0.28em] text-accent-text uppercase">{label}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold tracking-tight">{headline}</h1>
      {body && <p className="mt-3 text-ink-soft">{body}</p>}
      <div className="mt-8 space-y-3">{children}</div>
    </main>
  )
}

export const PRIMARY = 'flex min-h-11 w-full items-center justify-center bg-ink px-4 text-sm text-page transition-colors hover:bg-ink-hover'

export const SECONDARY =
  'flex min-h-11 w-full items-center justify-center border border-ink px-4 text-sm transition-colors hover:bg-ink hover:text-page'
