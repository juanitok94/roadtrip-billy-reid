import { imageById } from '@/lib/images'

// A navy-and-ink duotone made only from theme tokens (see .rt-duo in globals.css). Decorative by default: alt="".
// Plain <img>: the site is a static export, and the files are already sized and compressed.
export default function Duotone({
  id,
  decorative = true,
  className = '',
  width,
  height,
}: {
  id: string
  decorative?: boolean
  className?: string
  width: number
  height: number
}) {
  const r = imageById(id)
  return (
    <span className={`rt-duo ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/images/${r.file}`} alt={decorative ? '' : r.alt} width={width} height={height} decoding="async" />
    </span>
  )
}
