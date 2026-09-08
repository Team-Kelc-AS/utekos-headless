import { cn } from '@/lib/utils/className'
import { Feather, ShieldCheckIcon } from 'lucide-react'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { H2 } from '@/components/typography/TypographyH2'
import { H3 } from '@/components/typography/TypographyH3'
import { PageSection } from '@/components/layout/PageSection'
import { frontpageSectionStackClassName } from '@/components/frontpage/layout/frontpageSectionStack'
import { P } from '@/components/typography/TypographyP'

export async function QualitySection() {
  'use cache'

  const cardClasses =
    'relative overflow-hidden rounded-[1.5rem] border border-border bg-jungle text-card-foreground  backdrop-blur-2xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl'

  return (
    <PageSection
      as='section'
      background='default'
      className={frontpageSectionStackClassName}
    >
      <article className='relative overflow-hidden'>
        <div className='grid grid-cols-1 auto-rows-fr gap-6 lg:grid-cols-3 lg:grid-rows-2 lg:auto-rows-auto'>
          <AnimatedBlock
            className='will-animate-fade-in-up flex h-full flex-col lg:col-span-2 lg:row-span-2'
            delay='0.2s'
            threshold={0.3}
          >
            <div
              className={cn(
                cardClasses,
                'group flex h-full w-full flex-col justify-center bg-jungle p-6 sm:p-8 lg:p-12'
              )}
            >
              <div
                className='via-coral-green pointer-events-none absolute inset-0 z-0 -translate-x-full bg-linear-to-r from-transparent to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full'
                aria-hidden='true'
              />

              <div className='relative z-10 text-left'>
                <H2
                  Text='Kvalitet i hver fiber'
                  ID='quality-section-heading'
                  className='pb-2 font-sans text-2xl font-bold tracking-tight text-card-foreground sm:text-3xl lg:text-4xl'
                />

                <P className='w-full text-left text-base text-card-foreground/85 not-first:mt-1 sm:text-lg md:max-w-xl'>
                  Fra den lette spensten i dunet til slitestyrken
                  i hver søm – vi er transparente om
                  materialvalgene som definerer Utekos. Dette er
                  kvalitet du kan føle på, designet for å vare.
                </P>
              </div>
            </div>
          </AnimatedBlock>

          <AnimatedBlock
            className='will-animate-fade-in-up flex h-full flex-col'
            delay='0.4s'
            threshold={0.3}
          >
            <div
              className={cn(
                cardClasses,
                'group flex h-full w-full flex-col justify-center bg-jungle p-6 sm:p-8 lg:p-10'
              )}
            >
              <div className='mb-3 flex min-w-0 items-center gap-3 sm:mb-4 sm:gap-4'>
                <div className='bg-dark-teal flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-primary-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-card-foreground/10 transition-transform duration-500 group-hover:scale-110 sm:h-12 sm:w-12'>
                  <Feather className='size-5 stroke-[1.5]' />
                </div>
                <H3 className='min-w-0 pb-0 font-utekos-text-medium text-xl leading-none tracking-normal text-card-foreground sm:text-2xl'>
                  Premium isolasjon
                </H3>
              </div>
              <P className='text-base text-card-foreground/85 not-first:mt-0 sm:text-lg'>
                Kun sertifisert dun og høykvalitets syntetisk
                fyll for optimal varme-til-vekt.
              </P>
            </div>
          </AnimatedBlock>

          <AnimatedBlock
            className='will-animate-fade-in-up flex h-full flex-col'
            delay='0.6s'
            threshold={0.3}
          >
            <div
              className={cn(
                cardClasses,
                'group flex h-full w-full flex-col justify-center bg-jungle p-6 sm:p-8 lg:p-10'
              )}
            >
              <div className='mb-3 flex min-w-0 items-center gap-3 sm:mb-4 sm:gap-4'>
                <div className='bg-dark-teal flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border duration-500 group-hover:scale-110 sm:h-12 sm:w-12'>
                  <ShieldCheckIcon className='size-5 stroke-[1.5]' />
                </div>
                <H3 className='min-w-0 pb-0 font-utekos-text-medium text-xl leading-none tracking-normal text-card-foreground sm:text-2xl'>
                  Bygget for å vare
                </H3>
              </div>
              <P className='text-base text-card-foreground/85 not-first:mt-0 sm:text-lg'>
                Slitesterke materialer og solide sømmer som tåler
                aktiv bruk i norske forhold.
              </P>
            </div>
          </AnimatedBlock>
        </div>
      </article>
    </PageSection>
  )
}
