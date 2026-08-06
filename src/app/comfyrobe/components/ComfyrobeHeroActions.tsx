'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { reportCanonicalSelectPromotion } from '@/lib/analytics/selectPromotionReporter'

type ComfyrobeHeroActionsProps = {
  primaryLabel: string
}

function createInteractionId(): string {
  try {
    return globalThis.crypto.randomUUID()
  } catch {
    return `comfyrobe-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
  }
}

function reportHeroSelection(
  creativeName: string,
  creativeSlot: string
): void {
  try {
    reportCanonicalSelectPromotion({
      customData: {
        interaction_id: createInteractionId(),
        promotion_id: 'comfyrobe-hero',
        promotion_name: 'Comfyrobe',
        creative_name: creativeName,
        creative_slot: creativeSlot
      }
    })
  } catch {
    return
  }
}

export function ComfyrobeHeroActions({
  primaryLabel
}: ComfyrobeHeroActionsProps) {
  return (
    <div className='mt-5 flex max-w-xl flex-col items-start gap-3 sm:flex-row sm:items-center md:mt-8'>
      <BrandBadge
        asChild
        className='min-h-13 w-full gap-2 bg-primary px-6 py-3 font-utekos-text-medium text-foreground transition-[filter,transform] hover:brightness-105 active:scale-[0.985] sm:w-auto'
      >
        <a
          href='#purchase-section'
          data-track='ComfyrobeHeroPrimaryCta'
          onClick={() =>
            reportHeroSelection(
              'Velg størrelse',
              'primary_cta'
            )
          }
        >
          {primaryLabel}

          <ArrowRight
            className='size-4'
            aria-hidden='true'
          />
        </a>
      </BrandBadge>

      <a
        href='#section-product-demo'
        data-track='ComfyrobeHeroSecondaryCta'
        onClick={() =>
          reportHeroSelection(
            'Se hvordan den beskytter',
            'secondary_cta'
          )
        }
        className='inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-utekos-text-medium text-sm text-white underline decoration-white/45 underline-offset-4 transition-colors hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
      >
        Se hvordan den beskytter

        <ChevronDown
          className='size-4'
          aria-hidden='true'
        />
      </a>
    </div>
  )
}