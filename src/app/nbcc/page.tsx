import type { Metadata } from 'next'
import { Suspense } from 'react'

import { NbccBenefitSection } from './components/NbccBenefitSection'
import { NbccFaqSection } from './components/NbccFaqSection'
import { NbccFinalCtaSection } from './components/NbccFinalCtaSection'
import { NbccMotionEnhancer } from './components/NbccMotionEnhancer'
import { NbccHeroSection } from './components/NbccHeroSection'
import { NbccHowToUseSection } from './components/NbccHowToUseSection'
import { NbccProductSection } from './components/NbccProductSection'
import { NbccProductSectionSkeleton } from './components/NbccProductSectionSkeleton'
import { NbccUseCasesSection } from './components/NbccUseCasesSection'
import { SITE_URL } from './constants'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:
    'NBCC-medlemsfordel hos Utekos | Camping, bobil og fortelt',
  description:
    'Utekos for NBCC-medlemmer: varme komfortplagg for camping, bobil, campingvogn, fortelt, markise og kjølige kvelder ute.',
  keywords: [
    'NBCC',
    'Utekos',
    'medlemsfordel',
    'camping',
    'bobil',
    'campingvogn',
    'fortelt',
    'markise',
    'terrasse',
    'kjølige kvelder ute'
  ],
  alternates: { canonical: '/nbcc' },
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    url: '/nbcc',
    siteName: 'Utekos',
    title: 'NBCC-medlemsfordel hos Utekos',
    description:
      'Praktisk varme for campingfolk, fra kaffe ved campingvogna til sene samtaler i forteltet.',
    images: [
      {
        url: '/og-utekos-nbcc-1200x630.jpg',
        width: 1200,
        height: 630,
        alt: 'NBCC-medlemsfordel hos Utekos'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NBCC-medlemsfordel hos Utekos',
    description:
      'Varme komfortplagg for camping, bobil, caravan og kjølige kvelder ute.',
    images: ['/og-utekos-nbcc-1200x630.jpg']
  }
}

export default function NbccPage() {
  return (
    <article data-nbcc-page className='bg-background dark:bg-dark-background'>
      <NbccMotionEnhancer />
      <NbccHeroSection />
      <NbccBenefitSection />
      <NbccUseCasesSection />
      <Suspense fallback={<NbccProductSectionSkeleton />}>
        <NbccProductSection />
      </Suspense>
      <NbccHowToUseSection />
      <NbccFaqSection />
      <NbccFinalCtaSection />
    </article>
  )
}
