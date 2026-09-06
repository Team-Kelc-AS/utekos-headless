// Path: src/app/handlehjelp/sammenlign-modeller/components/ConclusionSection.tsx
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import Link from 'next/link'
import { faqItems } from '../utils/comparisonData'

export function ConclusionSection() {
  return (
    <article className='bg-background py-20 text-foreground sm:py-28'>
      <div className='mx-auto max-w-7xl px-[6vw]'>
        <div className='grid gap-12 lg:grid-cols-[0.45fr_0.55fr] lg:items-start'>
          <div>
            <BrandBadge
              label='Klar for å velge'
              tone='featured'
              className='mb-6 px-6 py-3 text-sm'
            />
            <h2 className='font-google-sans font-sans text-4xl leading-[0.95] font-bold tracking-[-0.01em] text-foreground sm:text-6xl'>
              Et trygt valg på under ett minutt
            </h2>
            <p className='leading-text-paragraph mt-6 text-lg text-muted-foreground sm:text-xl'>
              TechDown gir mest ro i skiftende vær. Dun gir mest
              varme per gram. Mikrofiber er lettest å pakke og
              vaske.
            </p>
            <div className='mt-9 flex flex-wrap gap-4'>
              <BrandBadge
                asChild
                tone='commerce-primary'
                className='px-7 py-4 text-base transition-transform duration-300 hover:scale-[1.02]'
              >
                <Link
                  href='/produkter'
                  data-track='SammenlignModellerConclusionAllProductsClick'
                >
                  Se hele kolleksjonen
                </Link>
              </BrandBadge>
              <BrandBadge
                asChild
                tone='commerce-secondary'
                className='px-7 py-4 text-base transition-transform duration-300 hover:scale-[1.02]'
              >
                <Link
                  href='/kontaktskjema'
                  data-track='SammenlignModellerConclusionContactClick'
                >
                  Få råd fra oss
                </Link>
              </BrandBadge>
            </div>
          </div>

          <div
            data-nosnippet
            className='divide-y divide-foreground/20 border-y border-foreground/20'
          >
            {faqItems.map(item => (
              <details
                key={item.question}
                className='group py-6'
              >
                <summary className='font-google-sans cursor-pointer list-none font-sans text-xl leading-[1.05] font-bold tracking-[-0.01em] text-foreground marker:hidden'>
                  <span className='inline-flex w-full items-center justify-between gap-6'>
                    {item.question}
                    <span className='text-2xl leading-none text-muted-foreground transition-transform duration-300 group-open:rotate-45'>
                      +
                    </span>
                  </span>
                </summary>
                <p
                  data-nosnippet
                  className='leading-text-paragraph mt-4 max-w-2xl text-base text-muted-foreground'
                >
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
