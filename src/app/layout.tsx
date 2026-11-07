import type { Metadata, Viewport } from 'next'
import '@fontsource/fraunces/600'
import '@fontsource/ibm-plex-mono/500'
import SiteFooter from '@/components/SiteFooter'
import { MAP } from '@/data/types'
import { SEO_DESCRIPTION, SEO_TITLE, SITE_URL } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL), alternates: { canonical: '/' } } : {}),
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  openGraph: { title: SEO_TITLE, description: SEO_DESCRIPTION, type: 'website', siteName: MAP.title },
  twitter: { card: 'summary', title: SEO_TITLE, description: SEO_DESCRIPTION },
}

export const viewport: Viewport = {
  themeColor: MAP.themeColor,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Turns the scroll effect on before first paint (so nothing shifts) unless the visitor prefers reduced motion. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('rt-anim')}catch(e){}",
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
