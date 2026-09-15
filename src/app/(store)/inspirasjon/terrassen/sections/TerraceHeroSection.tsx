import { H1 } from '@/components/typography/TypographyH1'
import { H3 } from '@/components/typography/TypographyH3'
import { Ingress } from '@/components/typography/Ingress'
import { P } from '@/components/typography/TypographyP'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { terraceHeroFeatures } from '../utils/terraceHeroFeatures'
import { MotionHeroCard, MotionReveal } from './TerraceMotion'

export function TerraceHeroSection() {
  return (
    <section
      aria-labelledby='din-terrasse-hele-året'
      className='relative isolate overflow-hidden'
    >
      <div className='relative z-10 container mx-auto flex max-w-7xl items-start px-5 pt-10 pb-10 sm:min-h-[calc(100svh-5rem)] sm:items-end sm:px-6 sm:pt-32 sm:pb-14 lg:min-h-[760px] lg:pb-16'>
        <MotionReveal
          y={34}
          amount={0.08}
          className='w-full max-w-5xl'
        >
          <div className='max-w-5xl'>
            <hgroup>
              <H1
                ID='din-terrasse-hele-året'
                Text='Din terrasse, hele året'
                className='text-foreground-on-dark -on-dark max-w-5xl tracking-normal'
              />
              <Ingress className='text-foreground-on-dark -on-dark mt-8 max-w-3xl text-lg'>
                Fra morgenkaffen ute til stjerneklare kvelder:
                gjør terrassen til det lune rommet du faktisk
                bruker når luften blir kjølig.
              </Ingress>
            </hgroup>

            <div className='mt-9 flex flex-wrap gap-3 sm:gap-4'>
              <BrandBadge
                asChild
                backgroundColor='var(--primary)'
                textColor='var(--primary-foreground)'
                className='group focus-visible:outline-primary font-google-sans min-h-12 border border-transparent px-6 py-3 text-base leading-4 font-bold shadow-[0_18px_42px_-30px_var(--primary)] transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
              >
                <Link href='/produkter'>
                  Se produkter
                  <ArrowRight className='ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0' />
                </Link>
              </BrandBadge>
              <BrandBadge
                asChild
                backgroundColor='var(--dark-teal)'
                textColor='var(--foreground)'
                className='font-google-sans min-h-12 border-none px-6 py-3 text-base leading-4 font-bold shadow-none transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0'
              >
                <Link href='#bruksomrader'>Planlegg bruken</Link>
              </BrandBadge>
            </div>
          </div>

          <div
            className='mt-10 grid gap-3 sm:grid-cols-3 lg:max-w-4xl'
            aria-label='Tre grep for mer terrasseliv'
          >
            {terraceHeroFeatures.map((feature, index) => {
              const Icon = feature.icon

              return (
                <MotionHeroCard
                  key={feature.title}
                  delay={0.18 + index * 0.08}
                  className='rounded-lg border-none bg-jungle p-4 text-foreground shadow-[0_30px_70px_-54px_rgb(0_0_0/0.9)] sm:p-5'
                >
                  <div className='flex items-start gap-4'>
                    <div className='flex size-11 shrink-0 items-center justify-center rounded-lg border border-(--terrace-line-dark) bg-dark-teal text-foreground'>
                      <Icon
                        className='size-5'
                        aria-hidden='true'
                      />
                    </div>
                    <div className='min-w-0 pt-0.5'>
                      <H3
                        Text={feature.title}
                        className='pb-0 text-xl leading-[1.05] text-card-foreground'
                      />
                      <P className='/80 mt-2 text-left text-sm leading-relaxed text-card-foreground/80 not-first:mt-2'>
                        {feature.description}
                      </P>
                    </div>
                  </div>
                </MotionHeroCard>
              )
            })}
          </div>
        </MotionReveal>
      </div>
    </section>
  )
}
