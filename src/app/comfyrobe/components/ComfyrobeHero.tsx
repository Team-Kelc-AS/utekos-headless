import comfyBgIpad from '@/assets/images/comfyrobe/comfy-bg-ipad.webp'
import comfyHeroWide from '@/assets/images/comfyrobe/comfy-hero-wide.webp'
import comfyMann45 from '@/assets/images/comfyrobe/comfy-mann-45.webp'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'
import type { ComfyrobeOfferSummary } from '../lib/buildComfyrobeOfferSummary'
import { ComfyrobeHeroActions } from './ComfyrobeHeroActions'
import { ComfyrobeResponsiveImage } from './ComfyrobeResponsiveImage'

type ComfyrobeHeroProps = {
  offer: ComfyrobeOfferSummary | null
}

function resolvePrimaryLabel(
  offer: ComfyrobeOfferSummary | null
): string {
  if (offer?.availableForSale) {
    return 'Velg størrelse'
  }

  if (offer) {
    return `Se størrelser – ${offer.priceLabel}`
  }

  return 'Se tilgjengelighet'
}

function resolveOfferDetails(
  offer: ComfyrobeOfferSummary | null
): string[] {
  return [
    offer?.compareAtPriceLabel ?
      `Før ${offer.compareAtPriceLabel}`
    : null,
    offer?.savingsAmountLabel &&
    offer.savingsPercentage !== null ?
      `Spar ${offer.savingsAmountLabel} (${offer.savingsPercentage} %)`
    : null,
    offer?.availabilityLabel ?? null,
    '14 dagers retur'
  ].filter((item): item is string => Boolean(item))
}

export function ComfyrobeHero({
  offer
}: ComfyrobeHeroProps) {
  const primaryLabel = resolvePrimaryLabel(offer)
  const offerDetails = resolveOfferDetails(offer)

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
          className='relative min-h-[calc(100svh-70px)] overflow-hidden bg-jungle text-foreground md:mx-auto md:rounded-xl md:px-8 lg:px-12'
        >
          <ComfyrobeResponsiveImage
            alt='Mann med mørk Comfyrobe fra Utekos'
            mobileSrc={comfyMann45}
            tabletSrc={comfyBgIpad}
            desktopSrc={comfyHeroWide}
            sizes='100vw'
            className='object-cover object-top'
            eager
          />

          <div className='relative z-10 mx-auto flex min-h-[calc(100svh-70px)] w-full max-w-350 items-end px-6 py-8 md:items-center md:px-12 md:py-20 lg:px-20'>
            <div className='w-full max-w-165 drop-shadow-[0_3px_18px_rgb(0_0_0/0.3)]'>
              <p className='mb-3 font-utekos-text-medium text-sm text-white/88 md:mb-5 md:w-fit md:rounded-full md:border md:border-white/20 md:bg-black/20 md:px-4 md:py-2 md:text-white'>
                Comfyrobe™
                {offer ? ` · Nå ${offer.priceLabel}` : ''}
              </p>

              <h1
                id='comfyrobe-hero-heading'
                className='font-google-sans max-w-[10ch] font-sans text-[clamp(2.75rem,12vw,3.75rem)] leading-[0.9] font-bold tracking-tight text-white md:text-6xl lg:text-7xl'
              >
                Tøff mot været.

                <span className='mt-2 block text-primary italic md:mt-3'>
                  Komfortabel mot deg.
                </span>
              </h1>

              <p className='mt-4 max-w-xl font-utekos-text text-base leading-7 text-white/92 md:mt-7 md:text-lg md:leading-relaxed'>
                Vanntett og vindtett på utsiden. SherpaCore™ på
                innsiden. En romslig allværskåpe for regn,
                hundeturen, sidelinjen og kalde dager.
              </p>

              <ComfyrobeHeroActions
                primaryLabel={primaryLabel}
              />

              <div className='mt-4 space-y-3 md:mt-6'>
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
                      purchaseAmount={
                        offer.klarnaPurchaseAmount
                      }
                      theme='default'
                    />
                  </div>
                : null}
              </div>
            </div>
          </div>
        </section>
      </PromotionImpression>

      <KlarnaOnSiteMessagingScript />
    </>
  )
}