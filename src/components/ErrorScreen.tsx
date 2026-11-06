import type { ReactNode } from 'react'

// Shared layout for the 404 and error pages. The footer comes from the layout (global-error adds its own, since it
// runs without the layout).
export default function ErrorScreen({
  label,
  headline,
  body,
  children,
}: {
  label: string
  headline: string
  body?: string
  children: ReactNode // the action buttons
}) {
  return (
    <main className="mx-auto min-h-[60vh] max-w-md px-4 py-12 text-center">
      <p className="text-xs tracking-[0.28em] text-rust uppercase">{label}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold tracking-tight">{headline}</h1>
      {body && <p className="mt-3 text-slate">{body}</p>}
      <div className="mt-8 space-y-3">{children}</div>
    </main>
  )
}

export const PRIMARY = 'flex min-h-11 w-full items-center justify-center bg-indigo px-4 text-sm text-cream transition-colors hover:bg-rust'

export const SECONDARY =
  'flex min-h-11 w-full items-center justify-center border border-indigo px-4 text-sm transition-colors hover:bg-indigo hover:text-cream'
