// Path: src/app/produkter/(oversikt)/components/MicrofiberSection/MikrofiberContentColumn.tsx

'use client'

import { ArrowRight, Feather } from 'lucide-react'
import Link from 'next/link'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { Button } from '@/components/ui/button'
import { BenefitCard } from '@/app/produkter/(oversikt)/components/BenefitCard'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils/className'

const benefits = [
  {
    label: '3-i-1 funksjonalitet',
    description: '— Parkas, oppfestet eller full lengde',
    glowColor: 'var(--sidebar-primary)',
    surface: 'dazzle' as const
  },
  {
    label: 'Lettvekt og kompakt',
    description: '— Bare ca. 800g, enkel å pakke',
    glowColor: 'var(--sidebar-primary)',
    surface: 'dazzle' as const
  },
  {
    label: 'YKK®-toveisglidelås',
    description: '— Bransjens mest anerkjente glidelås',
    glowColor: 'var(--sidebar-primary)',
    surface: 'dazzle' as const
  }
]

export function MikrofiberContentColumn() {
  const [containerRef, containerInView] = useInView({
    threshold: 0.5
  })
  const [badgeRef, badgeInView] = useInView({ threshold: 1 })
  const [h2Ref, h2InView] = useInView({ threshold: 1 })
  const [pRef, pInView] = useInView({ threshold: 1 })
  const [ctaRef, ctaInView] = useInView({ threshold: 1 })

  return (
    <div
      ref={containerRef}
      className={cn(
        'will-animate-fade-in-up h-full min-h-full',
        containerInView && 'is-in-view'
      )}
      style={
        { '--transition-delay': '0.1s' } as React.CSSProperties
      }
    >
      <div className='flex h-full min-h-full flex-col justify-start'>
        <div>
          <div
            ref={badgeRef}
            className={cn(
              'will-animate-fade-in-up mb-5',
              badgeInView && 'is-in-view'
            )}
            style={
              {
                '--transition-delay': '0.3s'
              } as React.CSSProperties
            }
          >
            <BrandBadge
              backgroundColor='var(--sidebar-primary)'
              textColor='var(--sidebar-primary-foreground)'
              className='gap-2 border border-sidebar-primary-foreground/12 px-4 py-2 text-sm font-medium'
            >
              <Feather
                className='size-4 text-sidebar-primary-foreground'
                aria-hidden='true'
              />
              <span>Ultralett allsidighet</span>
            </BrandBadge>
          </div>
          <h2
            ref={h2Ref}
            className={cn(
              'will-animate-fade-in-up font-sans text-balance text-foreground',
              h2InView && 'is-in-view'
            )}
            style={
              {
                '--transition-delay': '0.4s'
              } as React.CSSProperties
            }
          >
            Lettvekt møter varme og allsidighet
          </h2>
          <p
            ref={pRef}
            className={cn(
              'will-animate-fade-in-up leading-text-paragraph mt-6 max-w-2xl text-lg text-foreground',
              pInView && 'is-in-view'
            )}
            style={
              {
                '--transition-delay': '0.5s'
              } as React.CSSProperties
            }
          >
            Utekos Mikrofiber™ gir deg følelsen av dun med ekstra
            fordeler. Beholder varmen selv når den blir fuktig og
            tørker raskt. Ulike snorstramminger sørger for at
            passformen kan justeres etter behov.
          </p>

          <ul className='mt-8 space-y-3 text-foreground'>
            {benefits.map((benefit, idx) => (
              <BenefitCard
                key={benefit.label}
                benefit={benefit}
                delay={0.6 + idx * 0.1}
              />
            ))}
          </ul>
          <div
            ref={ctaRef}
            className={cn(
              'will-animate-fade-in-up mt-8',
              ctaInView && 'is-in-view'
            )}
            style={
              {
                '--transition-delay': '0.9s'
              } as React.CSSProperties
            }
          >
            <Button
              asChild
              variant='seeProduct'
              size='lg'
              className='group min-h-12 w-full gap-2 rounded-full px-6 py-3 font-utekos-text-medium text-base leading-[1.35] whitespace-normal shadow-[0_18px_40px_-28px_color-mix(in_oklch,var(--sidebar-primary)_70%,transparent)] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto sm:whitespace-nowrap'
            >
              <Link
                href='/produkter/utekos-mikrofiber'
                data-track='MikrofiberContentProductPageExploreClick'
              >
                Utforsk Mikrofiber™
                <ArrowRight className='size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none' />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
