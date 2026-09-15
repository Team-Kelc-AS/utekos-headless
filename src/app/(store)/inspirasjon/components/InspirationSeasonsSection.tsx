import { InspirationSeasonsTabs } from './InspirationSeasonsTabs'
import type { InspirationSeasonDefinition } from '../theme/seasons'
import { inspirationSurfaces } from '../theme/surfaces'
import { cn } from '@/lib/utils/className'
import { H2 } from '@/components/typography/TypographyH2'
import { Lead } from '@/components/typography/Lead'

interface InspirationSeasonsSectionProps {
  title: string
  lead: string
  seasons: readonly InspirationSeasonDefinition[]
  defaultValue: string
  glowTokens?: readonly [string, string]
  variant?: 'pill' | 'rounded'
  showTips?: boolean
  sectionClassName?: string
  titleClassName?: string
  leadClassName?: string
  tabTriggerClassName?: string
  tabActiveClassName?: string
  tabInactiveClassName?: string
  contentCardClassName?: string
  contentIconClassName?: string
  contentIconGlyphClassName?: string
  contentTitleClassName?: string
  contentTextClassName?: string
  showSectionGlow?: boolean
  showTabGlow?: boolean
  showCardGlow?: boolean
}

export function InspirationSeasonsSection({
  title,
  lead,
  seasons,
  defaultValue,
  glowTokens,
  variant = 'rounded',
  showTips = false,
  sectionClassName,
  titleClassName,
  leadClassName,
  tabTriggerClassName,
  tabActiveClassName,
  tabInactiveClassName,
  contentCardClassName,
  contentIconClassName,
  contentIconGlyphClassName,
  contentTitleClassName,
  contentTextClassName,
  showSectionGlow = true,
  showTabGlow = true,
  showCardGlow = true
}: InspirationSeasonsSectionProps) {
  const [glowA, glowB] = glowTokens ?? [
    'var(--primary)',
    'var(--mountain-view)'
  ]

  return (
    <article
      className={cn(
        'relative isolate overflow-hidden py-24',
        inspirationSurfaces.darkSection,
        inspirationSurfaces.darkSectionText,
        sectionClassName
      )}
    >
      <div className='pointer-events-none absolute inset-0 -z-10 opacity-20'>
        {showSectionGlow ?
          <>
            <div
              className='inspiration-seasons-glow-pulse absolute top-1/4 left-0 h-[500px] w-full max-w-[500px] blur-3xl md:left-1/4'
              style={{
                background: `radial-gradient(circle, ${glowA} 0%, transparent 70%)`
              }}
            />
            <div
              className='inspiration-seasons-glow-pulse absolute right-0 bottom-1/4 h-[500px] w-full max-w-[500px] blur-3xl md:right-1/4'
              style={{
                background: `radial-gradient(circle, ${glowB} 0%, transparent 70%)`,
                animationDelay: '4s'
              }}
            />
          </>
        : null}
      </div>

      <div className='container mx-auto px-4'>
        <div className='animate-fade-in-up mb-16 max-w-4xl text-left'>
          <H2
            ID='inspiration-seasons-title'
            Text={title}
            className={cn(
              'pb-0 text-left text-foreground',
              titleClassName
            )}
          />
          <Lead
            Text={lead}
            className={cn(
              'text-ancient-water mt-6 max-w-2xl pb-0 text-left md:pb-0 lg:pb-0',
              leadClassName
            )}
          />
        </div>

        <div className='inspiration-seasons-fade-in-delayed'>
          <InspirationSeasonsTabs
            seasons={seasons}
            defaultValue={defaultValue}
            variant={variant}
            showTips={showTips}
            {...(tabTriggerClassName !== undefined ?
              { tabTriggerClassName }
            : {})}
            {...(tabActiveClassName !== undefined ?
              { tabActiveClassName }
            : {})}
            {...(tabInactiveClassName !== undefined ?
              { tabInactiveClassName }
            : {})}
            {...(contentCardClassName !== undefined ?
              { contentCardClassName }
            : {})}
            {...(contentIconClassName !== undefined ?
              { contentIconClassName }
            : {})}
            {...(contentIconGlyphClassName !== undefined ?
              { contentIconGlyphClassName }
            : {})}
            {...(contentTitleClassName !== undefined ?
              { contentTitleClassName }
            : {})}
            {...(contentTextClassName !== undefined ?
              { contentTextClassName }
            : {})}
            showTabGlow={showTabGlow}
            showCardGlow={showCardGlow}
          />
        </div>
      </div>
    </article>
  )
}
