// Path: src/app/handlehjelp/sammenlign-modeller/page.tsx
import type { Metadata } from 'next'
import { CompareModelsPageHero } from './components/CompareModelsPageHero'
import { ConclusionSection } from './components/ConclusionSection'
import { ComparisonSection } from './components/ComparisonSection'
import { DeepDiveSection } from './components/DeepDiveSection'
import { PersonaCards } from './components/PersonaCards'

const pageTitle = 'Hvilken Utekos passer best for deg?'
const pageDescription =
  'Finn riktig Utekos for hytte, bobil, båt og norsk vær. Se forskjellen på Utekos Dun, Utekos Mikrofiber og Utekos TechDown.'

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    'hvilken utekos er best',
    'utekos dun vs mikrofiber',
    'sammenlign utekos',
    'utekos techdown',
    'utekos til hytte',
    'utekos til båt',
    'utekos til bobil'
  ],
  alternates: {
    canonical: '/handlehjelp/sammenlign-modeller'
  },
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    title: pageTitle,
    description: pageDescription,
    url: 'https://utekos.no/handlehjelp/sammenlign-modeller',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-image-compare.jpg',
        width: 1200,
        height: 630,
        alt: 'Sammenligning av Utekos Dun, Mikrofiber og TechDown'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
    images: ['/og-image-compare.jpg']
  }
}

export default function CompareModelsPage() {
  return (
    <article className='bg-background'>
      <CompareModelsPageHero />
      <PersonaCards />
      <ComparisonSection />
      <DeepDiveSection />
      <ConclusionSection />
    </article>
  )
}
