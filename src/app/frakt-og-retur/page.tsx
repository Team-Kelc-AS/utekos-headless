// Path: src/app/frakt-og-retur/page.tsx
import { InfoSidebar } from '@/app/frakt-og-retur/components/InfoSideBar'
import { ShippingReturnsHeader } from '@/app/frakt-og-retur/components/ShippingReturnsHeader'
import { ShippingReturnsInfo } from '@/app/frakt-og-retur/components/ShippingReturnsInfo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title: 'Frakt, retur og bytte av våre produkter | Utekos',
  description:
    'Bestillinger hos Utekos gir fri frakt på ordre over 999 kr og gratis 14-dagers fri retur. Les vilkårene for en trygg og forutsigbar handleopplevelse.',
  alternates: { canonical: '/frakt-og-retur' },
  openGraph: {
    title: 'Frakt, retur og bytte av våre produkter | Utekos',
    description:
      'Få svar på alt du lurer på om levering og retur. Handle trygt hos Utekos.',
    url: '/frakt-og-retur',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-image-frakt-retur.jpg',
        width: 1200,
        height: 630,
        alt: 'En Utekos-pakke klar for sending.'
      }
    ],
    locale: 'no_NO',
    type: 'website'
  }
}

import { PatternFrame } from '@/components/ui/pattern-frame'

export default function ShippingAndReturnsPage() {
  return (
    <article className='mx-auto w-full bg-background dark:bg-dark-background pt-12 pb-20 sm:pt-16 sm:pb-28'>
      <ShippingReturnsHeader />

      <PatternFrame
        as='section'
        surface='transparent'
        variant='content'
        contentWidth='min(100%, 80rem)' // Skalerer perfekt opp til max-w-7xl
        className='mt-12 py-8 sm:mt-16 lg:py-12'
        contentClassName='grid grid-cols-1 items-start gap-8 px-6 sm:px-8 lg:grid-cols-12 lg:gap-12'
      >
        <ShippingReturnsInfo />
        <InfoSidebar />
      </PatternFrame>
    </article>
  )
}
