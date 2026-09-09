import 'server-only'

import { PRODUCT_VARIANTS } from '@/api/constants'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { cn } from '@/lib/utils/className'
import {
  choiceGridClass,
  choicePillClass
} from '../utils/constants'
import { LandingProductHighlightsPanel } from './LandingProductHighlightsPanel'

export function LandingPurchaseProductInformation({
  modelName
}: {
  modelName: string
}) {
  const content = PRODUCT_VARIANTS['utekos-techdown']

  return (
    <div
      className='mb-6 space-y-6 min-[900px]:mb-12 min-[900px]:space-y-8'
      aria-label='Produktinformasjon'
    >
      <AnimatedBlock
        className='will-animate-fade-in-up'
        delay='0.05s'
        rootMargin='0px 0px 25% 0px'
        threshold={0.01}
      >
        <div className={choiceGridClass}>
          {content.features.map(feature => (
            <span
              key={feature}
              className={cn(
                choicePillClass,
                'rounded-2xl border border-border bg-jungle-tone font-sans text-[11px] text-foreground shadow-sm min-[900px]:font-bold md:max-xl:text-[14px]'
              )}
            >
              {feature}
            </span>
          ))}
        </div>
      </AnimatedBlock>

      <AnimatedBlock
        className='will-animate-fade-in-up'
        delay='0.1s'
        rootMargin='0px 0px 25% 0px'
        threshold={0.01}
      >
        <LandingProductHighlightsPanel
          modelName={modelName}
          selectedModel='utekos-techdown'
          highlights={content.highlights}
        />
      </AnimatedBlock>
    </div>
  )
}
