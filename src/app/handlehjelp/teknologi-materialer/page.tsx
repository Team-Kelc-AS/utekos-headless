// Path: src/app/handlehjelp/teknologi-materialer/page.tsx

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Coffee, Move, Maximize2 } from 'lucide-react'
import { ProductSpecsView } from './components/ProductSpecsView'
import { technologyGroups } from './config'
import { TechHero } from './components/TechHero'
import { ProductSpecPageHeader } from './components/ProductSpecPageHeader'
import { NavigationCTA } from './components/NavigationCTA'

const modeCardClassName =
  'group relative overflow-hidden rounded-3xl border border-card-foreground/10 bg-card p-8 text-card-foreground ring-1 ring-card-foreground/12 backdrop-blur-xl transition-all duration-500 hover:border-foreground/20 hover:shadow-2xl'

const modeIconClassName =
  'mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-card-foreground/10 text-card-foreground ring-1 ring-card-foreground/10'

const modeHoverGlowClassName =
  'pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100'

export const metadata: Metadata = {
  title: 'Teknologi og materialer',
  description: 'Utforsk teknologien bak Utekos',
  keywords: [
    'Utekos teknologi',
    'TechDown',
    'varmedress',
    'SherpaCore',
    'Vannsøyle 8000mm',
    'Varmeklær teknologi',
    'yttertøy',
    'vinterdress',
    '3-i-1 design'
  ],
  alternates: { canonical: '/handlehjelp/teknologi-materialer' },
  openGraph: {
    title:
      'Teknologi & Materialer | Vitenskapen bak din komfort',
    description:
      'Lær om de unike materialene som gjør Utekos til det ultimate valget for nordisk vær. Se hvordan TechDown™ og HydroGuard™ fungerer.',
    url: '/handlehjelp/teknologi-materialer',
    siteName: 'Utekos',
    locale: 'no_NO',
    type: 'article',
    images: [
      {
        url: '/og-image-utekos-produkter.jpg',
        width: 1200,
        height: 630,
        alt: 'Nærbilde av Utekos tekniske materialer og lag-på-lag konstruksjon.'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teknologi og materialer',
    description:
      'Oppdag teknologien som holder deg varm. TechDown™, HydroGuard™ og mer.',
    images: ['/og-image-utekos-produkter.jpg']
  }
}

export default function ProductSpecsPage() {
  return (
    <article className='text-foreground'>
      <TechHero />

      <article className='relative z-20 container mx-auto -mt-20 px-4 pb-24'>
        <div className='grid gap-6 md:grid-cols-3'>
          <div className={modeCardClassName}>
            <div
              className={`${modeHoverGlowClassName} from-secondary/10`}
            />

            <div className='relative z-10'>
              <div className={modeIconClassName}>
                <Maximize2 className='h-6 w-6' aria-hidden />
              </div>
              <h3 className='font-google-sans mb-2 text-xl font-bold text-card-foreground'>
                1. Fullengdemodus
              </h3>
              <p className='font-google-sans mb-4 pb-2 text-xl font-bold text-card-foreground md:text-2xl'>
                Maksimal isolasjon
              </p>
              <p className='leading-text-paragraph mt-2 font-utekos-text! tracking-wide text-card-foreground/90 md:text-xl!'>
                Utgangspunktet for selve utekosen. Plagget henger
                i full lengde som en isolerende kokong. Perfekt
                for solveggen, hengekøyen eller lange kvelder på
                terrassen.
              </p>
            </div>
          </div>

          <div className={modeCardClassName}>
            <div
              className={`${modeHoverGlowClassName} from-primary/10`}
            />

            <div className='relative z-10'>
              <div className={modeIconClassName}>
                <Coffee className='h-6 w-6' aria-hidden />
              </div>
              <h3 className='font-google-sans mb-2 font-sans text-xl font-bold text-card-foreground'>
                2. Oppjustert modus
              </h3>
              <p className='font-google-sans mb-4 text-sm font-bold tracking-wider text-card-foreground'>
                Umiddelbar mobilitet
              </p>
              <p className='text-card-foreground/90'>
                Nyter du total omfavnelse av Utekos, men må
                plutselig på kjøkkenet eller svare telefonen?
                Heis opp plagget til ønsket lengde, stram snoren
                i livet og bli mobil på sekunder. Beveg deg trygt
                og subbefritt – uten å miste varmen.
              </p>
            </div>
          </div>

          <div className={modeCardClassName}>
            <div
              className={`${modeHoverGlowClassName} from-accent/10`}
            />

            <div className='relative z-10'>
              <div className={modeIconClassName}>
                <Move className='h-6 w-6' aria-hidden />
              </div>
              <h3 className='font-google-sans mb-2 font-sans text-xl font-bold text-card-foreground'>
                3. Parkasmodus
              </h3>
              <p className='font-google-sans mb-4 text-sm font-bold tracking-wider text-card-foreground'>
                Aktiv utendørs
              </p>
              <p className='text-card-foreground/90'>
                For turer og lengre avstander. Brett nedre del
                innunder seg og stram til for å forvandle Utekos
                til en stilig parkas. Full bevegelsesfrihet med
                et elegant snitt.
              </p>
            </div>
          </div>
        </div>
      </article>

      <article className='container mx-auto px-4'>
        <Suspense>
          <ProductSpecPageHeader />
        </Suspense>

        <Suspense>
          <ProductSpecsView
            technologyGroups={technologyGroups}
          />
        </Suspense>
      </article>

      <NavigationCTA />
    </article>
  )
}
