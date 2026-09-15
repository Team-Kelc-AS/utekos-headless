// Path: src/app/(store)/inspirasjon/batliv/page.tsx
import type { Metadata } from 'next'
import { UseCasesGrid, useCasesData } from './UseCasesGrid'
import { BenefitsGrid } from './BenefitsGrid'
import { CTASection } from './CTASection'
import { SocialProof } from './SocialProof'
import {
  PopularDestinations,
  popularDestinationsData
} from './PopularDestinations'
import { BoatSeasonSection } from './BoatSeasonSection'
import { BoatingHeroSection } from './BoatingHeroSection'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title: 'Båtliv og Utekos | Forleng sesongen og kveldene på vannet',
  description:
    'Oppdag hvordan Utekos forvandler båtlivet. Fra kjølige morgener i havgapet til sosiale kvelder i gjestehavna – nyt en lengre og mer komfortabel båtsesong.',
  keywords: [
    'båtliv',
    'båtkos',
    'norsk båtsommer',
    'utekos båt',
    'varme i båt',
    'komfort båttur',
    'båtutstyr',
    'seilbåt',
    'bryggekos'
  ],
  alternates: {
    canonical: '/inspirasjon/batliv'
  },
  openGraph: {
    title: 'Båtliv og Utekos | Forleng den norske båtsommeren',
    description:
      'Ikke la kjølige kvelder og vind forkorte tiden på sjøen. Oppdag hvordan Utekos blir din beste følgesvenn på båtturen.',
    url: '/inspirasjon/batliv',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-image-batliv.webp',
        width: 1200,
        height: 630,
        alt: 'Gruppe venner som koser seg i en båt med Utekos-plagg'
      }
    ],
    locale: 'no_NO',
    type: 'article'
  }
}
export default async function Page({ children }: { children: React.ReactNode }) {
  return (
     <article>
         <BoatingHeroSection />
          <UseCasesGrid useCases={useCasesData} />
          <BenefitsGrid  />
          <BoatSeasonSection />
          <SocialProof />
          <PopularDestinations destinations={popularDestinationsData} />
        <CTASection />
        {children}
    </article>
  )
}
