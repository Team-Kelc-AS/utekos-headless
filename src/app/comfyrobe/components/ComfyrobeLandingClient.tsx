'use client'

import Image from 'next/image'
import * as m from 'motion/react-m'
import { ArrowRight, ChevronDown } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'
import { reportCanonicalSelectPromotion } from '@/lib/analytics/selectPromotionReporter'
import { scrollToElement } from '@/lib/motion/scrollToElement'
import type { ComfyrobeOfferSummary } from '../lib/buildComfyrobeOfferSummary'
import {
  comfyrobeRevealGroup,
  comfyrobeRevealItem
} from './comfyrobeMotionVariants'

function reportHeroSelection(
  creativeName: string,
  creativeSlot: string
) {
  reportCanonicalSelectPromotion({
    customData: {
      interaction_id: globalThis.crypto.randomUUID(),
      promotion_id: 'comfyrobe-hero',
      promotion_name: 'Comfyrobe',
      creative_name: creativeName,
      creative_slot: creativeSlot
    }
  })
}

function scrollTo(
  id: string,
  creativeName: string,
  creativeSlot: string
) {
  reportHeroSelection(creativeName, creativeSlot)
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
  void scrollToElement(id, { offsetY: 76, reducedMotion })
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
          className='relative min-h-[calc(100svh-70px)] overflow-hidden bg-[#001919] text-white'
        >
          <picture className='absolute inset-0 block bg-muted'>
            <source
              media='(min-width: 48rem)'
              srcSet='https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Comfy-1920-1080-2.webp?v=1784870433'
            />
            <Image
              src='https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Comfyrobe-Kvinne-1600x1600.png?v=1784824903'
              alt='Kvinne med mørk Comfyrobe fra Utekos'
              fill
              priority
              sizes='100vw'
              className='object-cover object-[57%_center] md:object-center'
            />
          </picture>

          <div
            aria-hidden
            className='absolute inset-0 bg-[linear-gradient(180deg,rgba(0,18,18,0.08)_0%,rgba(0,18,18,0.3)_38%,rgba(0,18,18,0.96)_100%)] md:bg-[linear-gradient(90deg,rgba(0,18,18,0.96)_0%,rgba(0,18,18,0.84)_32%,rgba(0,18,18,0.28)_57%,rgba(0,18,18,0.08)_75%)]'
          />

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
                <span className='mt-2 block text-[oklch(0.78_0.15_67)] italic md:mt-3'>
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
                  bgColor='oklch(0.78 0.15 67)'
                  fgColor='oklch(0.165 0.0282 194.77)'
                  className='min-h-13 w-full gap-2 px-6 py-3 font-utekos-text-medium transition-[filter,transform] hover:brightness-105 active:scale-[0.985] sm:w-auto'
                >
                  <button
                    type='button'
                    data-track='ComfyrobeHeroPrimaryCta'
                    onClick={() =>
                      scrollTo(
                        'purchase-section',
                        'Velg størrelse',
                        'primary_cta'
                      )
                    }
                  >
                    {primaryLabel}
                    <ArrowRight className='size-4' aria-hidden />
                  </button>
                </BrandBadge>

                <button
                  type='button'
                  data-track='ComfyrobeHeroSecondaryCta'
                  onClick={() =>
                    scrollTo(
                      'section-product-demo',
                      'Se hvordan den beskytter',
                      'secondary_cta'
                    )
                  }
                  className='inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-utekos-text-medium text-sm text-white underline decoration-white/45 underline-offset-4 transition-colors hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
                >
                  Se hvordan den beskytter
                  <ChevronDown className='size-4' aria-hidden />
                </button>
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
