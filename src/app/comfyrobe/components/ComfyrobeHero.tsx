import comfyBgIpad from '@/assets/images/comfyrobe/comfy-bg-ipad.webp'
import comfyHeroWide from '@/assets/images/comfyrobe/comfy-hero-wide.webp'
import comfyMann45 from '@/assets/images/comfyrobe/comfy-mann-45.webp'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { ComfyrobeOfferSummary } from '../lib/buildComfyrobeOfferSummary'
import { buildComfyrobePurchaseModel } from '../lib/buildComfyrobePurchaseModel'
import { ComfyrobeHeroActions } from './ComfyrobeHeroActions'
import { ComfyrobePurchaseLinks } from './ComfyrobePurchaseLinks'
import { ComfyrobeResponsiveImage } from './ComfyrobeResponsiveImage'
import type { ShopifyProduct } from 'types/product'

type ComfyrobeHeroProps = {
  offer: ComfyrobeOfferSummary | null
  product: ShopifyProduct | null
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

export function ComfyrobeHero({
  offer,
  product
}: ComfyrobeHeroProps) {
  const primaryLabel = resolvePrimaryLabel(offer)
  const savingsAmount = offer?.savingsAmountLabel?.replace(
    /\s*kr$/,
    ''
  )
  const purchaseModel =
    product ? buildComfyrobePurchaseModel(product) : null
  const selectedVariant =
    purchaseModel?.product.variants.find(
      variant =>
        variant.availableForSale &&
        variant.selectedOptions.some(
          option =>
            option.name === 'Størrelse' && option.value === 'XL'
        )
    ) ??
    purchaseModel?.product.variants.find(
      variant => variant.id === purchaseModel.initialVariantId
    ) ??
    null

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
          className='overflow-hidden bg-jungle text-foreground md:mx-auto md:grid md:grid-cols-2 md:rounded-xl'
        >
          <div className='relative aspect-4/5 w-full md:aspect-auto md:min-h-[42rem] lg:min-h-[46rem]'>
            <ComfyrobeResponsiveImage
              alt='Mann med mørk Comfyrobe fra Utekos'
              mobileSrc={comfyMann45}
              tabletSrc={comfyBgIpad}
              desktopSrc={comfyHeroWide}
              sizes='100vw'
              className='object-cover object-top'
              eager
            />
            <Badge className='absolute bottom-4 left-4 h-auto rounded-lg bg-cloud-dancer px-3 py-2 font-utekos-text-medium text-sm text-background md:bottom-6 md:left-6'>
              Fjellnatt
            </Badge>
          </div>

          <div className='bg-background px-6 pt-4 pb-6 md:flex md:bg-night md:px-12 md:pt-6 md:pb-12 lg:px-20 lg:pt-8 lg:pb-14'>
            <div className='mx-auto w-full max-w-350'>
              <div className='flex w-full max-w-165 flex-col'>
                <Link
                  href='/produkter/utekos-techdown?farge=havdyp&storrelse=stor&kjonn=unisex'
                  className='mb-4 inline-flex min-h-11 items-center font-utekos-text text-sm text-white/82 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
                >
                  <ChevronLeft
                    strokeWidth={2.5}
                    className='size-4'
                    aria-hidden
                  />
                  Utekos TechDown™ Havdyp
                </Link>

                <div className='mb-0 font-utekos-text-medium text-white md:mb-2 md:text-sm'>
                  <h1
                    id='comfyrobe-hero-heading'
                    className='font-google-sans mb-3 flex items-baseline gap-2 font-sans text-[clamp(1.5rem,6.5vw,2.25rem)] leading-tight font-bold tracking-tight whitespace-nowrap text-white md:mb-5 md:gap-3 md:text-4xl lg:text-5xl'
                  >
                    <span>Comfyrobe™ XL</span>
                    {offer?.priceLabel ?
                      <>
                        <span aria-hidden>–</span>
                        <span className='text-primary'>
                          {offer.priceLabel}
                        </span>
                      </>
                    : null}
                  </h1>

                  <div className='md:hidden'>
                    <div className='flex items-center justify-start gap-2 text-xs'>
                      {offer?.compareAtPriceLabel ?
                        <>
                          <span className='whitespace-nowrap text-white/68 line-through'>
                            {offer.compareAtPriceLabel}
                          </span>
                          <Separator
                            orientation='vertical'
                            className='h-4 self-auto bg-white/30'
                          />
                        </>
                      : null}
                      {savingsAmount ?
                        <>
                          <span className='whitespace-nowrap'>
                            Spar kr {savingsAmount}
                          </span>
                          <Separator
                            orientation='vertical'
                            className='h-4 self-auto bg-white/30'
                          />
                        </>
                      : null}
                      <span className='whitespace-nowrap'>
                        Gratis frakt
                      </span>
                    </div>
                  </div>

                  <div className='hidden md:flex md:flex-nowrap md:items-center md:justify-start md:gap-2'>
                    {offer?.compareAtPriceLabel ?
                      <>
                        <span className='whitespace-nowrap text-white/68 line-through'>
                          {offer.compareAtPriceLabel}
                        </span>
                        <Separator
                          orientation='vertical'
                          className='h-4 self-auto bg-white/30'
                        />
                      </>
                    : null}
                    {savingsAmount ?
                      <>
                        <span className='whitespace-nowrap'>
                          Spar kr {savingsAmount}
                        </span>
                        <Separator
                          orientation='vertical'
                          className='h-4 self-auto bg-white/30'
                        />
                      </>
                    : null}
                    <span className='whitespace-nowrap'>
                      Gratis frakt
                    </span>
                  </div>
                </div>

                <div className='order-1 mt-0 max-w-md overflow-hidden md:order-4 md:mt-6'>
                  {offer?.klarnaPurchaseAmount ?
                    <div
                      role='group'
                      aria-label='Betalingsinformasjon fra Klarna'
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

                <p className='order-3 mt-3 max-w-xl font-utekos-text text-base leading-7 text-white/92 md:order-2 md:mt-3 md:text-lg md:leading-relaxed'>
                  Møt skiftende høstvær i en lang og romslig
                  ytterjakke som kombinerer klassisk design med
                  pålitelig værbeskyttelse. Med en vannsøyle på 8
                  000 mm og en robust toveis YKK®-glidelås,
                  holder denne jakken deg varm og tørr uansett
                  anledning. Smarte detaljer som fôrede
                  sidelommer gir ekstra varme til hendene, mens
                  strategiske snitt bak og i sidene sørger for at
                  den lange passformen gir deg full
                  bevegelsesfrihet gjennom hele dagen.
                </p>

                <div className='order-4 md:order-3'>
                  <ComfyrobeHeroActions
                    primaryLabel={primaryLabel}
                    product={purchaseModel?.product ?? null}
                    selectedVariant={selectedVariant}
                  />
                </div>

                <ComfyrobePurchaseLinks className='mt-4 hidden md:order-4 md:flex md:flex-row md:gap-6' />
              </div>
            </div>
          </div>
        </section>
      </PromotionImpression>

      <KlarnaOnSiteMessagingScript />
    </>
  )
}
