import type { Metadata, Viewport } from 'next'
import '@fontsource/fraunces/600'
import '@fontsource/ibm-plex-mono/500'
import SiteFooter from '@/components/SiteFooter'
import { MAP } from '@/data/types'
import { imageById } from '@/lib/images'
import { INDEXABLE, SEO_DESCRIPTION, SEO_TITLE, SITE_URL } from '@/lib/site'
import './globals.css'

// Social preview: public/og.jpg (1200x630), a duotone crop of the hero photograph (record "og-social" in images.json).
// metadataBase makes the og:image URL absolute; it falls back to the planned address when NEXT_PUBLIC_SITE_URL is unset
// (the canonical link still needs the env var).
const OG = imageById('og-social')
const OG_IMAGE = { url: `/${OG.file}`, width: 1200, height: 630, alt: OG.alt }

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL ?? 'https://roadtripbr.peachykeandev.com'),
  ...(SITE_URL ? { alternates: { canonical: '/' } } : {}),
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: 'website',
    locale: 'en_US',
    siteName: MAP.title,
    images: [OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: SEO_TITLE, description: SEO_DESCRIPTION, images: [OG_IMAGE] },
  ...(INDEXABLE ? {} : { robots: { index: false, follow: false } }),
}

export const viewport: Viewport = {
  themeColor: MAP.themeColor,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Before first paint (so nothing shifts), unless the visitor prefers reduced motion: rt-anim turns the scroll effect
            on; rt-intro plays the load-in once per visit (session), on the home page only, and is removed when it is over
            so nothing replays. Without JS neither class is set and everything is simply there. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('rt-anim');var p=location.pathname;if((p=='/'||p=='/index.html')&&!sessionStorage.getItem('rt-intro')){sessionStorage.setItem('rt-intro','1');d.classList.add('rt-intro');setTimeout(function(){d.classList.remove('rt-intro')},2000)}}}catch(e){}",
          }}
        />
      </head>
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
