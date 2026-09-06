// Path: src/app/gaveguide/page.tsx

import type { Metadata } from 'next'
import { ProductCarousel } from '@/app/gaveguide/components/ProductCardCarousel'
import { TrustSection } from './components/TrustSection'
import { SocialProofSection } from './components/SocialProofSection'
import { GaveGuideHero } from './components/GaveGuideHero'
import { ViewCategoryObserver } from '@/components/analytics/ViewCategoryObserver'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title: 'Finn den perfekte gaven til dine nærmeste hos Utekos',
  description:
    'Gi bort varme, komfort og utallige koselige øyeblikk. Vår gaveguide hjelper deg å finne den perfekte gaven til den som har alt.',
  keywords: [
    'gave til far',
    'gave til mor',
    'julegave',
    'gavetips hytteeier',
    'gave til bobilentusiast',
    'gave til den som har alt'
  ],
  alternates: { canonical: '/gaveguide' },
  openGraph: {
    title: 'Utekos Gaveguide',
    description:
      'En gave de garantert kommer til å elske og bruke. Hele året.',
    url: '/gaveguide',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-image-farsdag.png',
        width: 1200,
        height: 630,
        alt: 'En person som glad pakker opp en Utekos-gave.'
      }
    ],
    locale: 'no_NO',
    type: 'website'
  }
}

export default function GaveguidePage() {
  return (
    <main className='bg-background'>
      <ViewCategoryObserver
        categoryId='gaveguide'
        categoryName='Gaveguide'
      />
      <GaveGuideHero />
      <article className='container mx-auto py-12 sm:py-16 md:max-w-7xl lg:py-16'>
        <ProductCarousel />
      </article>
      <SocialProofSection />

      <TrustSection />
    </main>
  )
}
