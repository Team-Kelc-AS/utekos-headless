import { MaintenanceJsonLd } from './MaintenanceJsonLd'
import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}
export const metadata: Metadata = {
  title:
    'Vedlikehold av Utekos | Slik bevarer du varmen i mange år',
  description:
    'En tydelig vedlikeholdsguide for Utekos Dun, Mikrofiber, TechDown og Comfyrobe. Riktig vask, tørking og oppbevaring bevarer varmen, formen og kvaliteten – sesong etter sesong.',
  alternates: { canonical: '/handlehjelp/vask-og-vedlikehold' },
  openGraph: {
    title:
      'Vedlikehold av Utekos | Slik bevarer du varmen i mange år',
    description:
      'Slik vasker, tørker og oppbevarer du Utekos-plagget ditt for å bevare varmen og kvaliteten i mange år.',
    url: '/handlehjelp/vask-og-vedlikehold',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-image-utekos-produkter.jpg',
        width: 1200,
        height: 630,
        alt: 'Et Utekos-plagg hengt luftig til tørk i naturlige omgivelser.'
      }
    ],
    locale: 'no_NO',
    type: 'article'
  }
}

export default function MaintenanceLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <article>
        <MaintenanceJsonLd />
        <div className='relative isolate min-h-[100dvh] w-full bg-background text-foreground'>
          <div className='relative z-10'>{children}</div>
        </div>
      </article>
    </>
  )
}
