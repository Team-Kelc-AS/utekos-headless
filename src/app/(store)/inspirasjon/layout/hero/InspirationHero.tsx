import type { ReactNode } from 'react'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { cn } from '@/lib/utils/className'
import { InspirationHeroFeatureGrid } from './InspirationHeroFeatureGrid'
import { InspirationHeroHeading } from './InspirationHeroHeading'
import { InspirationHeroSection } from './InspirationHeroSection'
import type { InspirationHeroAlign, InspirationHeroFeature } from './types'

interface InspirationHeroProps {
  labelledById: string
  title: ReactNode
  lead: ReactNode
  features: readonly InspirationHeroFeature[]
  featuresHeading: string
  featuresHeadingId: string
  breadcrumb?: ReactNode
  actions?: ReactNode
  as?: 'section' | 'article'
  align?: InspirationHeroAlign
  minHeight?: 'standard' | 'tall' | 'content'
  surfaceClassName?: string
  background?: ReactNode
  containerClassName?: string
  titleColor?: string
  titleClassName?: string
  leadClassName?: string
}

export function InspirationHero({
  labelledById,
  title,
  lead,
  features,
  featuresHeading,
  featuresHeadingId,
  breadcrumb,
  actions,
  as,
  align = 'left',
  minHeight,
  surfaceClassName,
  background,
  containerClassName,
  titleColor,
  titleClassName,
  leadClassName
}: InspirationHeroProps) {
  const centered = align === 'center'

  return (
    <InspirationHeroSection
      labelledBy={labelledById}
      align={align}
      {...(as !== undefined ? { as } : {})}
      {...(minHeight !== undefined ? { minHeight } : {})}
      {...(surfaceClassName !== undefined ? { surfaceClassName } : {})}
      {...(background !== undefined ? { background } : {})}
      {...(containerClassName !== undefined ? { containerClassName } : {})}
    >
      <header className={cn(breadcrumb && 'flex flex-col gap-10 md:gap-12')}>
        {breadcrumb ?
          <AnimatedBlock
            className={cn(
              'will-animate-fade-in-up',
              centered && 'flex justify-center'
            )}
            delay='0.1s'
          >
            {breadcrumb}
          </AnimatedBlock>
        : null}

        <AnimatedBlock className='will-animate-fade-in-up' delay='0.2s'>
          <InspirationHeroHeading
            id={labelledById}
            title={title}
            lead={lead}
            align={align}
            {...(titleColor !== undefined ? { titleColor } : {})}
            {...(titleClassName !== undefined ? { titleClassName } : {})}
            {...(leadClassName !== undefined ? { leadClassName } : {})}
          />
        </AnimatedBlock>

        {actions ?
          <AnimatedBlock
            className={cn(
              'will-animate-fade-in-up mt-10 flex flex-wrap gap-4',
              centered && 'justify-center'
            )}
            delay='0.4s'
          >
            {actions}
          </AnimatedBlock>
        : null}
      </header>

      <AnimatedBlock
        className='will-animate-fade-in-up mt-16 sm:mt-20'
        delay='0.5s'
      >
        <InspirationHeroFeatureGrid
          features={features}
          heading={featuresHeading}
          headingId={featuresHeadingId}
          align={align}
        />
      </AnimatedBlock>
    </InspirationHeroSection>
  )
}
