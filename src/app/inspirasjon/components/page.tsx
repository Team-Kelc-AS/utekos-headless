// Path: src/app/inspirasjon/hytte/page.tsx

import type { Metadata } from 'next'
import {
  BenefitsGrid,
  benefitsData
} from '@/app/inspirasjon/hytte/sections/BenefitsGrid'
import { CabinHeroSection } from '@/app/inspirasjon/hytte/sections/CabinHeroSection'
import { HytteSeasonsSection } from '@/app/inspirasjon/hytte/sections/HytteSeasonsSection'
import { JusterFormNyt } from '@/app/inspirasjon/hytte/sections/JusterFormNyt'
import { SkalViTrekkeInnSection } from '@/app/inspirasjon/hytte/sections/SkalViTrekkeInnSection'
import { TailwindSection } from '@/app/inspirasjon/hytte/sections/Tailwind'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title: 'Guide til optimal hyttekomfort med Utekos',
  description:
    'Oppdag hvordan Utekos forvandler hytteopplevelsen. Fra kjølige morgener på terrassen til sene kvelder under stjernene. Opplev komforten som skaper minner.',
  keywords: [
    'hytteliv',
    'hyttekos',
    'norsk hytte',
    'utekos hytte',
    'vinterhytte'
  ],
  alternates: { canonical: '/inspirasjon/hytte' },
  openGraph: {
    title: 'Guide til optimal hyttekomfort med Utekos',
    description:
      'Oppdag hvordan Utekos forvandler hytteopplevelsen. Fra kjølige morgener på terrassen til sene kvelder under stjernene.',
    url: '/inspirasjon/hytte',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-image-hytte.jpg',
        width: 1200,
        height: 630,
        alt: 'Vennegjeng som koser seg utenfor hytten med Utekos-plagg'
      }
    ],
    locale: 'no_NO',
    type: 'website'
  }
}

export default function CabinInspirationPage() {
  return (
    <>
      <article className='flex flex-col'>
        <CabinHeroSection />
        <HytteSeasonsSection />
        <SkalViTrekkeInnSection />
        <JusterFormNyt />
        <BenefitsGrid benefits={benefitsData} />
        <TailwindSection />
      </article>
    </>
  )
}
