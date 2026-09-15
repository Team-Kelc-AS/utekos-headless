import { cn } from '@/lib/utils/className'
import { InspirationHeroFeatureCard } from './InspirationHeroFeatureCard'
import type { InspirationHeroAlign, InspirationHeroFeature } from './types'

interface InspirationHeroFeatureGridProps {
  features: readonly InspirationHeroFeature[]
  heading: string
  headingId: string
  align?: InspirationHeroAlign
  columnsClassName?: string
  className?: string
}

export function InspirationHeroFeatureGrid({
  features,
  heading,
  headingId,
  align = 'left',
  columnsClassName = 'grid-cols-1 sm:grid-cols-3',
  className
}: InspirationHeroFeatureGridProps) {
  return (
    <>
      <h2 id={headingId} className='sr-only'>
        {heading}
      </h2>

      <ul
        aria-labelledby={headingId}
        className={cn(
          'grid w-full gap-5',
          columnsClassName,
          align === 'center' && 'text-left',
          className
        )}
      >
        {features.map(feature => (
          <InspirationHeroFeatureCard key={feature.title} feature={feature} />
        ))}
      </ul>
    </>
  )
}
