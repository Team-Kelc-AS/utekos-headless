'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Shield } from 'lucide-react'
import Link from 'next/link'
import { BenefitCard } from './BenefitCard'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils/className'
import { H2 } from '@/components/typography/TypographyH2'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { P } from '@/components/typography/TypographyP'

const benefits = [
  {
    label: 'Vanntett og vindtett',
    description: '— 8000mm vannsøyle',
    glowColor: 'var(--primary)',
    tone: 'water' as const
  },
  {
    label: 'Lammeull-fôr',
    description: '— Varm og hurtigtørkende',
    glowColor: 'var(--primary)',
    tone: 'mauve' as const
  },
  {
    label: 'Toveis YKK®-glidelås',
    description: '— Enkel av- og påkledning',
    glowColor: 'var(--primary)',
    tone: 'overcast' as const
  }
]

export function ComfyrobeContentColumn() {
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
        'will-animate-fade-in-up min-w-0',
        containerInView && 'is-in-view'
      )}
      style={
        { '--transition-delay': '0.1s' } as React.CSSProperties
      }
    >
      <div
        ref={badgeRef}
        className={cn(
          'will-animate-fade-in-up mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 xl:mb-4 xl:px-5 xl:py-3',
          badgeInView && 'is-in-view'
        )}
        style={
          { '--transition-delay': '0.3s' } as React.CSSProperties
        }
      >
        <Shield className='size-4 text-foreground' />
        <InlineText className='font-utekos-text-medium text-sm text-foreground'>
          Comfyrobe™
        </InlineText>
      </div>

      <div
        ref={h2Ref}
        className={cn(
          'will-animate-fade-in-up',
          h2InView && 'is-in-view'
        )}
        style={
          { '--transition-delay': '0.4s' } as React.CSSProperties
        }
      >
        <H2
          ID='comfyrobe-heading'
          className='pb-0 text-3xl! text-balance sm:text-4xl!'
        >
          Tøff mot været, komfortabel for deg
        </H2>
      </div>

      <div
        ref={pRef}
        className={cn(
          'will-animate-fade-in-up',
          pInView && 'is-in-view'
        )}
        style={
          { '--transition-delay': '0.5s' } as React.CSSProperties
        }
      >
        <P className='mt-3 text-base! tracking-normal text-card-foreground not-first:mt-0 sm:text-lg! lg:text-base! xl:mt-4 xl:text-lg!'>
          Comfyrobe™ kombinerer funksjon, tidløst design og
          kompromissløs komfort. Vanntett og vindtett ytterstoff
          med pustende membran holder deg tørr, mens det tykke
          sherpa-fôret omslutter deg med varme.
        </P>
      </div>

      <ul className='mt-6 space-y-2 xl:mt-8 xl:space-y-3'>
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
          'will-animate-fade-in-up',
          ctaInView && 'is-in-view'
        )}
        style={
          { '--transition-delay': '0.9s' } as React.CSSProperties
        }
      >
        <Button
          asChild
          variant='default'
          size='lg'
          className='group mt-6 w-full rounded-3xl! px-8! py-6! font-utekos-text-medium shadow-[0_18px_40px_-28px_color-mix(in_oklch,var(--primary)_55%,transparent)] transition-all duration-300 hover:scale-105! sm:w-auto xl:mt-8'
        >
          <Link href='/comfyrobe'>
            <InlineText>Utforsk Comfyrobe™</InlineText>
            <ArrowRight className='ml-2 size-4 transition-transform duration-300 group-hover/button:translate-x-1' />
          </Link>
        </Button>
      </div>
    </div>
  )
}
