// Path: src/app/handlehjelp/storrelsesguide/page.tsx

import { BackToShopCta } from './components/BackToShopCta'
import { ComfyrobeSizeGuide } from './components/ComfyrobeSizeGuide'
import { TechDownSizeGuide } from './components/TechDownSizeGuide'
import { UtekosSizeGuide } from './components/UtekosSizeGuide'
import { SizeGuideHero } from './components/SizeGuideHero'
import { AdaptSection } from './components/AdaptSection'
import { TechDownMeasurement } from './components/TechDownMeasurement'
import { TechDownHgroup } from './components/TechDownHgroup'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title:
    'Størrelsesguide for Utekos | Finn din perfekte passform',
  description:
    'Sikre deg den ultimate komforten. Vår detaljerte størrelsesguide for Utekos Dun, Mikrofiber og Comfyrobe hjelper deg å velge riktig størrelse for de gode stundene.',
  alternates: { canonical: '/handlehjelp/storrelsesguide' },
  openGraph: {
    title:
      'Størrelsesguide for Utekos | Finn din perfekte passform',
    description:
      'Finn riktig størrelse og sikre deg den unike Utekos-komforten.',
    url: '/handlehjelp/storrelsesguide',
    siteName: 'Utekos',
    images: [
      {
        url: 'https://utekos.no/og-storrelsesskjema-techdown.png',
        width: 1200,
        height: 630,
        alt: 'Illustrasjon av måleskjema for Utekos-produkter.'
      }
    ],
    locale: 'no_NO',
    type: 'website'
  }
}

export default function SizeGuidePage() {
  return (
    <article className='mx-auto lg:max-w-7xl!'>
      <SizeGuideHero />
      <TechDownSizeGuide />
      <TechDownHgroup />
      <TechDownMeasurement />

      <UtekosSizeGuide />
      <AdaptSection />
      <ComfyrobeSizeGuide />
      <BackToShopCta surface='card' />
    </article>
  )
}
