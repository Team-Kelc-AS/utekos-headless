// Path: src/app/inspirasjon/isbading/page.tsx

import type { Metadata } from 'next'

import { IceBathingHeroSection } from './sections/IceBathingHeroSection'
import {
  BenefitsGrid,
  benefitsData
} from './sections/BenefitsGrid'
import {
  UseCasesGrid,
  useCasesData
} from './sections/UseCasesGrid'
import { SeasonsSection } from './sections/SeasonsSection'
import {
  PopularSpotsGrid,
  popularSpotsData
} from './sections/PopularSpotsGrid'
import { SocialProof } from './sections/SocialProof'
import { CTASection } from './sections/CTASection'
import Link from 'next/link'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { ProductSpotlight } from './sections/ProductSpotlight'
import { IceBathingFAQ } from './sections/IceBathingFAQ'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title:
    'Isbading og Utekos | Varmen du trenger etter kuldesjokket',
  description:
    'Gjør isbadingen til en komfortabel opplevelse. Fra det kalde dykket til den varme omfavnelsen etterpå – Utekos er isbaderens viktigste utstyr.',
  keywords: [
    'isbading',
    'vinterbading',
    'helårsbading',
    'badekåpe isbading',
    'skifteponcho',
    'utekos'
  ],
  alternates: { canonical: '/inspirasjon/isbading' },
  openGraph: {
    title: 'Comfyrobe™ | Forleng følelsen av mestring',
    description:
      'Slipp å fryse mens du skifter. Oppdag hvordan Utekos gjør overgangen fra iskaldt vann til varm bil lekende lett.',
    url: '/inspirasjon/isbading',
    siteName: 'Utekos',
    images: [
      {
        url: '/comfyrobe/comfy-isbading-1080-master.png',
        width: 1200,
        height: 630,
        alt: 'Isbader som varmer seg i Utekos-plagg etter et bad'
      }
    ],
    locale: 'no_NO',
    type: 'website'
  }
}

export default function IceBathingInspirationPage() {
  return (
    <article className='flex flex-col gap-12 pb-20'>
      <IceBathingHeroSection />
      <ProductSpotlight />

      <UseCasesGrid useCases={useCasesData} />

      <BenefitsGrid benefits={benefitsData} />

      <SeasonsSection />

      <IceBathingFAQ />

      <PopularSpotsGrid destinations={popularSpotsData} />

      <SocialProof />

      <CTASection />

      <div className='animate-in slide-in-from-bottom-10 fade-in fixed right-4 bottom-4 left-4 z-50 duration-700 md:hidden'>
        <BrandBadge
          asChild
          backgroundColor='var(--primary)'
          textColor='var(--background)'
          className='dark:border-dark-primary/24 font-google-sans min-h-14 w-full border border-primary/24 px-6 py-3 text-base leading-4 font-bold tracking-normal shadow-2xl transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105'
        >
          <Link href='/produkter/comfyrobe'>
            Kjøp Comfyrobe™
          </Link>
        </BrandBadge>
      </div>
    </article>
  )
}
