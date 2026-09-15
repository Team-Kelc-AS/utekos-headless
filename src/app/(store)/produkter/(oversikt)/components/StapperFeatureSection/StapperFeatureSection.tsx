import StapperImage from '@/assets/images/partners/stapper-hvit.png'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { PackageCheck } from 'lucide-react'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { IconRenderer } from './IconRenderer'
import { stapperFeatures } from './stapperFeatures'

export function StapperFeatureSection() {
  const imagePanel = (
    <Card className='relative isolate min-h-88 overflow-hidden rounded-3xl border-foreground/12 bg-foreground/[0.035] py-0 shadow-none backdrop-blur-[2px] sm:min-h-104 lg:min-h-132'>
      <CardContent className='relative flex size-full min-h-[inherit] items-center justify-center p-0'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,color-mix(in_oklab,var(--ancient-water)_18%,transparent),transparent_44%)]' />
        <div className='absolute inset-x-10 bottom-8 h-24 rounded-full bg-background/55 blur-3xl' />
        <div className='absolute top-8 right-8 hidden rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-card-foreground uppercase sm:block'>
          100 g
        </div>
        <Image
          src={StapperImage}
          alt='Utekos Stapper kompresjonsbag'
          fill
          className='object-contain p-8 drop-shadow-[0_30px_56px_rgba(8,10,24,0.42)] transition-transform duration-700 hover:scale-[1.03] sm:p-10 lg:p-12'
          sizes='(max-width: 640px) 88vw, (max-width: 1024px) 42rem, 38rem'
        />
      </CardContent>
    </Card>
  )

  return (
    <article className='relative mb-8 overflow-hidden rounded-[1.75rem] border border-border bg-muted px-5 py-8 text-foreground sm:px-8 sm:py-10 lg:px-10 xl:px-12'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 opacity-40'
        style={{
          background:
            'radial-gradient(circle at 78% 34%, color-mix(in oklab, var(--sidebar-primary) 18%, transparent), transparent 42%)'
        }}
      />

      <div className='pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-foreground/30 to-transparent' />

      <div className='mx-auto max-w-312'>
        <div className='grid gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(28rem,1.14fr)] lg:items-center xl:gap-12'>
          <div className='mx-auto max-w-xl text-center lg:mx-0 lg:text-left'>
            <AnimatedBlock className='will-animate-fade-in-up'>
              <Badge
                variant='outline'
                className='mb-5 h-auto border-border bg-sidebar-primary px-3.5 py-2 text-foreground'
              >
                Utekos Stapper™
              </Badge>
            </AnimatedBlock>

            <AnimatedBlock className='will-animate-fade-in-up'>
              <h2 className='font-google-sans text-4xl leading-[0.96] font-bold text-foreground max-sm:text-left sm:text-5xl lg:text-[4.35rem]'>
                Mer plass. Mindre stress.
              </h2>
            </AnimatedBlock>

            <AnimatedBlock
              className='will-animate-fade-in-up'
              delay='0.1s'
            >
              <p className='leading-text-paragraph mx-auto mt-6 max-w-xl text-lg text-foreground max-sm:text-left lg:mx-0'>
                Forvandle voluminøse jakker og soveposer til
                kompakte pakker. Utekos Stapper™ er den smarte
                løsningen for deg som verdsetter en effektiv og
                organisert bagasje på hytta, i bobilen eller i
                tursekken.
              </p>
            </AnimatedBlock>

            <AnimatedBlock className='will-animate-fade-in-up mt-8'>
              <BrandBadge
                asChild
                backgroundColor='var(--primary)'
                textColor='var(--background)'
                className='group min-h-14 justify-center border border-primary/18 px-7 text-base shadow-[0_16px_36px_-24px_rgba(232,178,66,0.55)] transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-105 lg:justify-start'
              >
                <Link
                  href={'/produkter/utekos-stapper' as Route}
                  data-track='StapperFeatureSectionDiscoverClick'
                >
                  Oppdag Stapper™
                  <PackageCheck className='ml-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-12' />
                </Link>
              </BrandBadge>
            </AnimatedBlock>
          </div>

          <AnimatedBlock
            className='will-animate-fade-in-scale'
            delay='0.2s'
            threshold={0.35}
          >
            {imagePanel}
          </AnimatedBlock>
        </div>

        <div className='mt-8 grid grid-cols-1 border-t border-foreground/10 text-left sm:grid-cols-2 lg:mt-10 lg:grid-cols-4'>
          {stapperFeatures.map((feature, index) => (
            <AnimatedBlock
              key={feature.title}
              className='will-animate-fade-in-up group relative flex gap-4 border-b border-foreground/10 py-6 sm:odd:pr-6 sm:even:border-l sm:even:border-foreground/10 sm:even:pl-6 lg:border-b-0 lg:border-l lg:border-foreground/10 lg:px-6 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0'
              delay={`${index * 0.08}s`}
            >
              <div className='mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-foreground/20 bg-muted text-foreground transition-transform duration-300 group-hover:-translate-y-0.5'>
                <IconRenderer
                  name={feature.icon}
                  className='h-4.5 w-4.5'
                />
              </div>
              <div>
                <h3 className='font-utekos-text-medium text-base leading-tight text-foreground'>
                  {feature.title}
                </h3>
                <p className='/90 mt-2 text-sm leading-relaxed text-foreground/90'>
                  {feature.description}
                </p>
              </div>
            </AnimatedBlock>
          ))}
        </div>
      </div>
    </article>
  )
}
