'use client'

import Image from 'next/image'
import * as m from 'motion/react-m'
import { ArrowRight, ChevronDown } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'
import { reportCanonicalSelectPromotion } from '@/lib/analytics/selectPromotionReporter'
import type { ComfyrobeOfferSummary } from '../lib/buildComfyrobeOfferSummary'
import {
  comfyrobeRevealGroup,
  comfyrobeRevealItem
} from './comfyrobeMotionVariants'

function createInteractionId(): string {
  try {
    return globalThis.crypto.randomUUID()
  } catch {
    return `comfyrobe-${Date.now()}-${Math.random().toString(36).slice(2)}`
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

export function ComfyrobeLandingClient({
  offer
}: {
  offer: ComfyrobeOfferSummary | null
}) {
  const primaryLabel =
    offer?.availableForSale ?
      `Velg størrelse – ${offer.priceLabel}`
    : offer ? `Se størrelser – ${offer.priceLabel}`
    : 'Se tilgjengelighet'
  const offerDetails = [
    offer?.compareAtPriceLabel ?
      `Før ${offer.compareAtPriceLabel}`
    : null,
    (
      offer?.savingsAmountLabel &&
      offer.savingsPercentage !== null
    ) ?
      `Spar ${offer.savingsAmountLabel} (${offer.savingsPercentage} %)`
    : null,
    offer?.availabilityLabel ?? null,
    '14 dagers retur'
  ].filter((item): item is string => Boolean(item))

  return (
    <>
      <PromotionImpression
        promotionId='comfyrobe-hero'
        promotionName='Comfyrobe'
        creativeName='Hero'
        creativeSlot='hero'
        className='w-full'
      >
        <section
          id='comfyrobe-hero'
          aria-labelledby='comfyrobe-hero-heading'
          className='relative min-h-[calc(100svh-70px)] overflow-hidden bg-jungle text-foreground md:mx-auto md:px-8 md:rounded-xl lg:px-12'
        >
          <picture className='absolute inset-0 block'>
            <source
              media='(min-width: 85.0625rem)'
              srcSet='/comfy-hero-wide.webp'
            />
            <source
              media='(min-width: 51rem) and (max-width: 85rem)'
              srcSet='/comfy-bg-ipad.webp'
            />
            <Image
              src='/comfy-mann-45.webp'
              alt='Mann med mørk Comfyrobe fra Utekos'
              fill
              priority
              sizes='100vw'
              className='object-cover object-top'
            />
          </picture>

          <div className='relative z-10 mx-auto flex min-h-[calc(100svh-70px)] w-full max-w-350 items-end px-6 py-8 md:items-center md:px-12 md:py-20 lg:px-20'>
            <m.div
              className='w-full max-w-165 drop-shadow-[0_3px_18px_rgb(0_0_0/0.3)]'
              initial='hidden'
              animate='visible'
              variants={comfyrobeRevealGroup}
            >
              <m.p
                className='mb-3 font-utekos-text-medium text-sm text-white/88 md:mb-5 md:w-fit md:rounded-full md:border md:border-white/20 md:bg-black/20 md:px-4 md:py-2 md:text-white'
                variants={comfyrobeRevealItem}
              >
                Comfyrobe™
                {offer ? ` · Nå ${offer.priceLabel}` : ''}
              </m.p>
              <m.h1
                id='comfyrobe-hero-heading'
                className='font-google-sans max-w-[10ch] font-sans text-[clamp(2.75rem,12vw,3.75rem)] leading-[0.9] font-bold tracking-tight text-white md:text-6xl lg:text-7xl'
                variants={comfyrobeRevealItem}
              >
                Tøff mot været.
                <span className='mt-2 block text-primary italic md:mt-3'>
                  Komfortabel mot deg.
                </span>
              </m.h1>
              <m.p
                className='mt-4 max-w-xl font-utekos-text text-base leading-7 text-white/92 md:mt-7 md:text-lg md:leading-relaxed'
                variants={comfyrobeRevealItem}
              >
                Vanntett og vindtett på utsiden. SherpaCore™ på
                innsiden. En romslig allværskåpe for regn,
                hundeturen, sidelinjen og kalde dager.
              </m.p>

              <m.div
                className='mt-5 flex max-w-xl flex-col items-start gap-3 sm:flex-row sm:items-center md:mt-8'
                variants={comfyrobeRevealItem}
              >
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
                    <ArrowRight className='size-4' aria-hidden />
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
                  <ChevronDown className='size-4' aria-hidden />
                </a>
              </m.div>

              <m.div
                className='mt-4 space-y-3 md:mt-6'
                variants={comfyrobeRevealItem}
              >
                <p className='max-w-xl text-sm leading-6 text-white/82'>
                  {offerDetails.join(' · ')}
                </p>
                {offer?.klarnaPurchaseAmount ?
                  <div
                    role='group'
                    aria-label='Betalingsinformasjon fra Klarna'
                    className='max-w-md overflow-hidden'
                  >
                    <KlarnaCreditPromotionAutoSize
                      id='klarna-credit-promotion-comfyrobe-landing-hero'
                      purchaseAmount={offer.klarnaPurchaseAmount}
                      theme='default'
                    />
                  </div>
                : null}
              </m.div>
            </m.div>
          </div>
        </section>
      </PromotionImpression>

      <KlarnaOnSiteMessagingScript />
    </>
  )
}