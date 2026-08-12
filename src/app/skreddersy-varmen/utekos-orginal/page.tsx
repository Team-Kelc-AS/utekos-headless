// Path: src/app/skreddersy-varmen/utekos-orginal/page.tsx
import type { Metadata } from 'next'
import { HeroSection } from './components/HeroSection'
import { EmpathySection } from '../components/EmpathySection'
import { ProductShowcase } from './components/ProductShowcase'
import { ThreeInOneDemo } from './components/ThreeInOneDemo'
import { SizeGuideTable } from './components/SizeGuideTable'
import { PurchaseSection } from './components/PurchaseSection'
import { ProductDetailsAccordion } from './components/ProductDetailsAccordion'

export const metadata: Metadata = {
  title: 'Skreddersy varmen | Utekos',
  description:
    'Kompromissløs komfort og overlegen allsidighet. Juster, form og nyt.',
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Utekos - Skreddersy varmen',
    description:
      'Kompromissløs komfort og overlegen allsidighet. Juster, form og nyt.',
    url: 'https://utekos.no/skreddersy-varmen/utekos-orginal',
    siteName: 'Utekos',
    locale: 'nb_NO',
    type: 'website',
    images: [
      {
        url: '/og-image-utekos-original.jpg',
        width: 1200,
        height: 630,
        alt: 'Personer som nyter utelivet med varme klær fra Utekos'
      }
    ]
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Skreddersy varmen |',
    description:
      'Skreddersy varmen med Utekos. Oppdag genial funksjonalitet og kompromissløs komfort for dine utendørsopplevelser. Juster, form og nyt.',
    images: ['/og-image-utekos-original.jpg']
  }
}

export default function UtekosOriginalLandingPage() {
  return (
    <article className='flex min-h-screen flex-col items-center justify-start bg-[#1F2421]'>
      <HeroSection />
      <EmpathySection />
      <ProductShowcase />
      <ThreeInOneDemo />
      <SizeGuideTable />
      <PurchaseSection />
      <ProductDetailsAccordion />
    </article>
  )
}
