// Path: src/app/skreddersy-varmen/page.tsx

import { Suspense } from 'react'
import { DeferredLandingSections } from '@/app/skreddersy-varmen/components/DeferredLandingSections'
import { HeroAndEmpathy } from './components/HeroEmpathy'
import { LandingPurchaseFallback } from './components/LandingPurchaseFallback'
import { LandingPurchaseSection } from './components/LandingPurchaseSection'
import { StickyMobileAction } from './components/StickyMobileAction'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { PreFooterNavigation } from './components/PreFooterNavigation'
import { SkreddersyVarmenBreadcrumbs } from './components/SkreddersyVarmenBreadcrumbs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:
    'Skreddersy varmen med banebrytende yttertøy fra Utekos',
  description:
    'Utekos er en markevare som designer funksjonelle utendørsklær for Kompromissløs komfort og overlegen allsidighet. Juster, form og nyt.',
  category: 'Yttertøy',
  authors: [{ name: 'Utekos', url: 'https://utekos.no/om-oss' }],
  creator: 'Utekos',
  publisher: 'Utekos',
  alternates: {
    canonical: 'https://utekos.no/skreddersy-varmen'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      'index': true,
      'follow': true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  },
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    title: 'Skreddersy varmen | Utekos',
    description:
      'Kompromissløs komfort og overlegen allsidighet. Juster, form og nyt.',
    url: 'https://utekos.no/skreddersy-varmen',
    siteName: 'Utekos',
    images: [
      {
        url: 'https://utekos.no/empathy-bonfire.webp',
        width: 1200,
        height: 630,
        alt: 'Utekos ved bålpanne - skreddersy varmen ute'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skreddersy varmen ute | Utekos',
    description:
      'Se hvordan Utekos gir justerbar varme for terrasse, hytte, båt og bobil.',
    images: ['https://utekos.no/empathy-bonfire.webp']
  }
}

export default function LandingPage() {
  return (
    <article className='dark:bg-dark-background flex min-h-screen w-full flex-col items-center justify-start overflow-x-clip bg-background'>
      <StickyMobileAction />

      <SkreddersyVarmenBreadcrumbs />
      <HeroAndEmpathy />

      <DeferredLandingSections />

      <div
        id='purchase-section'
        className='w-full scroll-mt-17.5 xl:scroll-mt-21.5'
      >
        <PromotionImpression
          promotionId='skreddersy-varmen-purchase'
          promotionName='Skreddersy varmen'
          creativeName='Purchase'
          creativeSlot='purchase'
          className='w-full'
        >
          <Suspense fallback={<LandingPurchaseFallback />}>
            <LandingPurchaseSection />
          </Suspense>
        </PromotionImpression>
      </div>

      <PreFooterNavigation />
    </article>
  )
}
