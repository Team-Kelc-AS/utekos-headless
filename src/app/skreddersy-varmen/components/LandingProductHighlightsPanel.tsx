import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils/className'
import type { PRODUCT_VARIANTS } from '@/api/constants'
import type { ModelKey } from '@/api/constants'

type LandingProductHighlightsPanelProps = {
  modelName: string
  selectedModel: ModelKey
  highlights: (typeof PRODUCT_VARIANTS)[ModelKey]['highlights']
}

export function LandingProductHighlightsPanel({
  modelName,
  selectedModel,
  highlights
}: LandingProductHighlightsPanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-border',
        'bg-jungle text-foreground shadow-[0_12px_40px_rgba(0,0,0,0.28)]'
      )}
    >
      <div className='border-b border-border px-5 py-4 sm:px-6 sm:py-5'>
        <h3 className='font-google-sans text-base font-bold tracking-tight text-foreground sm:text-lg'>
          Dette gjør {modelName} spesiell
        </h3>
        <p className='mt-1 text-sm text-foreground/80'>
          Kvaliteter som gjør forskjellen i hverdagen
        </p>
      </div>

      <Accordion
        key={`highlights-${selectedModel}`}
        className='w-full'
      >
        {highlights.map((highlight, index) => (
          <AccordionItem
            key={highlight.title}
            value={highlight.title}
            className='border-b border-border last:border-b-0'
          >
            <AccordionTrigger
              className={cn(
                'bg-jungle px-5 py-4 text-left font-utekos-text-medium text-sm sm:px-6 sm:text-base',
                'text-foreground hover:text-primary hover:no-underline',
                'data-[state=open]:text-primary'
              )}
            >
              <span className='flex min-w-0 items-center gap-3'>
                <span
                  aria-hidden
                  className='font-google-sans flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground tabular-nums'
                >
                  {index + 1}
                </span>
                <span className='min-w-0'>
                  {highlight.title}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent
              className={cn(
                'leading-text-paragraph bg-jungle pt-0 pb-4 text-sm text-foreground/80 sm:pb-5',
                'px-5 sm:px-6 sm:pl-16'
              )}
            >
              {highlight.body}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
