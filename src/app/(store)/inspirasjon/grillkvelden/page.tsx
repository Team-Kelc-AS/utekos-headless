import type { Metadata } from 'next'
import {
  HostTipsGrid,
  hostTipsData
} from './sections/HostTipsGrid'
import {
  BenefitsGrid,
  benefitsData
} from './sections/BenefitsGrid'
import {
  UseCasesGrid,
  useCasesData
} from './sections/UseCasesGrid'
import { GrillHeroSection } from './sections/GrillHeroSection'
import { CTASection } from './sections/CTASection'
import { GrillSeasonsSection } from './sections/GrillSeasonsSection'
import { GrillMasterSection } from './sections/GrillMasterSection'
import { jsonLd } from './data/jsonLd'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title:
    'Grillkvelden & Utekos | Slik blir du den perfekte verten',
  description:
    'Oppdag hemmeligheten bak en vellykket grillkveld som varer. Med Utekos kan du og gjestene dine nyte maten, samtalen og stemningen i timevis, uansett temperatur.',
  keywords: [
    'grillkveld',
    'grillfest',
    'grilltips',
    'holde varmen ute',
    'sosialt samvær',
    'grille om høsten',
    'vertstips'
  ],
  alternates: { canonical: '/inspirasjon/grillkvelden' },
  openGraph: {
    title:
      'Grillkvelden & Utekos | Forleng hyggen, bli en legendarisk vert',
    description:
      'Ikke la en kjølig kveld sette en stopper for den gode stemningen. Se hvordan Utekos lar deg være verten for grillkveldene alle husker.',
    url: '/inspirasjon/grillkvelden',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-image-grillkvelden.webp',
        width: 1200,
        height: 630,
        alt: 'Vennegjeng samlet rundt et bord utendørs for en grillkveld, iført Utekos.'
      }
    ],
    locale: 'no_NO',
    type: 'article'
  }
}

export default function GrillInspirationPage() {
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
        }}
      />

      <GrillHeroSection />
      <UseCasesGrid useCases={useCasesData} />
      <BenefitsGrid benefits={benefitsData} />
      <GrillSeasonsSection />
      <HostTipsGrid tips={hostTipsData} />
      <GrillMasterSection />
      <CTASection />
    </>
  )
}
