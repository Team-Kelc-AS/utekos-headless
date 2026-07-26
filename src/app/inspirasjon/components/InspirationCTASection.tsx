import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { inspirationSurfaces } from '../theme/surfaces'
import { cn } from '@/lib/utils/className'
import { H2 } from '@/components/typography/TypographyH2'
import { Lead } from '@/components/typography/Lead'

import type { Route } from 'next'

interface InspirationCTASectionProps {
  title: string
  lead: string
  primaryHref?: Route
  secondaryHref?: Route
  primaryLabel?: string
  secondaryLabel?: string
  primaryTrackId?: string
  secondaryTrackId?: string
  /** Dekor-glow accent token for radial gradient */
  accentGlow?: string
  showAccentGlow?: boolean
  primaryButtonBg?: string
  primaryButtonText?: string
  secondaryButtonBg?: string
  secondaryButtonText?: string
  primaryButtonClassName?: string
  secondaryButtonClassName?: string
  sectionClassName?: string
  titleClassName?: string
  leadClassName?: string
  disableAnimatedBlock?: boolean
}

export function InspirationCTASection({
  title,
  lead,
  primaryHref = '/produkter' as Route,
  secondaryHref = '/handlehjelp/storrelsesguide' as Route,
  primaryLabel = 'Se alle produkter',
  secondaryLabel = 'Finn din størrelse',
  primaryTrackId,
  secondaryTrackId,
  accentGlow = 'var(--ancient-water)',
  showAccentGlow = true,
  primaryButtonBg = 'var(--flame-orange)',
  primaryButtonText = 'var(--black-beauty)',
  secondaryButtonBg = 'var(--mountain-view)',
  secondaryButtonText = 'var(--foreground)',
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  titleClassName,
  leadClassName,
  disableAnimatedBlock = false
}: InspirationCTASectionProps) {
  const content = (
    <>
      <H2
        ID='inspiration-cta-title'
        Text={title}
        className={cn(
          'mb-6 pb-0 text-center text-[clamp(3rem,6vw,5.75rem)] leading-[0.95]',
          'text-foreground',
          titleClassName
        )}
      />
      <Lead
        Text={lead}
        className={cn(
          'mx-auto mb-8 max-w-2xl pb-0 text-center md:pb-0 lg:pb-0',
          'text-ancient-water',
          leadClassName
        )}
      />
      <div className='flex flex-wrap justify-center gap-4'>
        <BrandBadge
          asChild
          backgroundColor={primaryButtonBg}
          textColor={primaryButtonText}
          className={cn(
            'group dark:border-dark-primary/24 font-google-sans min-h-14 border border-primary/24 px-8 py-4 text-base leading-4 font-bold tracking-normal shadow-xl transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105',
            primaryButtonClassName
          )}
        >
          <Link href={primaryHref} data-track={primaryTrackId}>
            {primaryLabel}
            <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
          </Link>
        </BrandBadge>
        <BrandBadge
          asChild
          backgroundColor={secondaryButtonBg}
          textColor={secondaryButtonText}
          className={cn(
            'dark:border-dark-background/14 font-google-sans min-h-14 border border-background/14 px-8 py-4 text-base leading-4 font-bold tracking-normal shadow-xl transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105',
            secondaryButtonClassName
          )}
        >
          <Link
            href={secondaryHref}
            data-track={secondaryTrackId}
          >
            {secondaryLabel}
          </Link>
        </BrandBadge>
      </div>
    </>
  )

  return (
    <article
      className={cn(
        'relative overflow-hidden border-t border-foreground/12 py-24',
        inspirationSurfaces.darkSection,
        sectionClassName
      )}
    >
      <div
        className={cn(
          'absolute inset-0',
          showAccentGlow ? 'opacity-[0.18]' : 'opacity-0'
        )}
        style={
          showAccentGlow ?
            {
              background: `radial-gradient(circle at 18% 12%, ${accentGlow} 0%, transparent 32%), radial-gradient(circle at 82% 20%, var(--color-soft-warm) 0%, transparent 28%)`
            }
          : undefined
        }
      />
      <div className='relative container mx-auto px-4 text-center'>
        {disableAnimatedBlock ?
          <div>{content}</div>
        : <AnimatedBlock className='will-animate-fade-in-scale'>
            {content}
          </AnimatedBlock>
        }
      </div>
    </article>
  )
}
