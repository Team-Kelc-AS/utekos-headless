// Path: src/app/handlehjelp/sammenlign-modeller/components/PersonaCards.tsx
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { modelRecommendations } from '../utils/comparisonData'

export function PersonaCards() {
  return (
    <article
      id='velg-etter-bruk'
      className='bg-background py-20 text-foreground sm:py-28'
    >
      <div className='mx-auto max-w-7xl'>
        <div className='mx-auto w-full max-w-3xl items-center justify-center px-4 text-center md:max-w-3xl lg:max-w-4xl'>
          <BrandBadge
            label='Velg etter bruk'
            tone='featured'
            className='mb-6 px-6 py-3 text-sm'
          />
          <h2 className='mx-auto text-foreground md:max-w-3xl'>
            Hva er riktig Utekos for deg?
          </h2>
          <p className='utekos-section-lead mx-auto mt-6 max-w-2xl text-muted-foreground md:max-w-3xl lg:max-w-4xl'>
            Å velge riktig Utekos handler i stor grad om å finne
            balansen mellom varme, vekt, pakkvolum og hva du
            faktisk skal bruke jakken til.
          </p>
        </div>

        <div className='mt-14 grid gap-8 lg:grid-cols-3'>
          {modelRecommendations.map(model => (
            <article
              key={model.key}
              className='group overflow-hidden border border-sidebar-foreground bg-sidebar text-sidebar-foreground'
            >
              <Link href={model.href as Route} className='block'>
                <div className='relative aspect-4/3 overflow-hidden'>
                  <Image
                    src={model.imageSrc}
                    alt={model.imageAlt}
                    fill
                    sizes='(max-width: 1024px) 100vw, 33vw'
                    className='object-cover transition-transform duration-700 group-hover:scale-[1.04]'
                  />
                </div>
                <div className='p-7 sm:p-8'>
                  <BrandBadge
                    label={model.badge}
                    tone='neutral'
                    className='mb-6 px-5 py-2 text-sm'
                  />
                  <h3 className='font-google-sans font-sans text-3xl leading-[0.95] font-bold tracking-[-0.01em] text-sidebar-foreground'>
                    {model.name}
                  </h3>
                  <p className='mt-3 text-lg leading-[1.35] font-medium text-sidebar-foreground'>
                    {model.bestFor}
                  </p>
                  <p className='leading-text-paragraph mt-4 text-base text-sidebar-foreground'>
                    {model.description}
                  </p>
                  <ul className='mt-6 space-y-2 text-sm font-medium text-sidebar-foreground'>
                    {model.proofPoints.map(point => (
                      <li
                        key={point}
                        className='flex items-center gap-3'
                      >
                        <span className='size-2 rounded-full bg-foreground' />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <span className='mt-7 inline-flex text-base font-medium text-sidebar-foreground underline decoration-sidebar-foreground underline-offset-8 transition-colors duration-300 group-hover:text-sidebar-foreground'>
                    {model.cta}
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </article>
  )
}
