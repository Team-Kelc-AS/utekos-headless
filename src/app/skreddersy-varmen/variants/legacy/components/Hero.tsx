// Path: src/app/skreddersy-varmen/components/Hero.tsx

import Image, { getImageProps } from 'next/image'
import CinemaOne from '@/assets/images/campaign/cinema-twilight.webp'
import MobileOne from '@/assets/images/campaign/skreddersy-varmen-hero-mobile.webp'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { HeroActions } from '@/app/skreddersy-varmen/components/HeroActions'
import { HeroStars } from '@/app/skreddersy-varmen/components/HeroStars'
import { formatPrice } from '@/lib/utils/formatPrice'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'
import { getKlarnaMinorUnitAmount } from '@/components/klarna/utils/getKlarnaMinorUnitAmount'
import { techDownReviewSummary } from '@/app/skreddersy-varmen/data/reviews'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'

export function Hero({
  commerce
}: {
  commerce: ProductCommerceViewModel | null
}) {
  const { props: desktopImage } = getImageProps({
    src: CinemaOne,
    alt: '',
    fill: true,
    quality: 85,
    sizes: '100vw'
  })
  const defaultVariant = commerce?.variants.find(
    variant => variant.commerce.id === commerce.defaultVariantId
  )
  const klarnaPurchaseAmount =
    defaultVariant ?
      getKlarnaMinorUnitAmount({
        amount: defaultVariant.commerce.price.amount,
        currencyCode: defaultVariant.commerce.price.currencyCode
      })
    : undefined

  return (
    <section
      aria-labelledby='hero-headline'
      className='dark:bg-dark-background relative min-h-[calc(100svh-70px)] w-full overflow-hidden bg-background font-sans text-foreground xl:min-h-[calc(100svh-86px)]'
    >
      <picture className='absolute inset-0 z-0 block'>
        <source
          media='(min-width: 768px)'
          srcSet={desktopImage.srcSet}
          sizes='100vw'
        />
        <Image
          src={MobileOne}
          alt=''
          fill
          loading='eager'
          fetchPriority='high'
          quality={80}
          sizes='100vw'
          className='object-cover'
        />
      </picture>

      <div
        aria-hidden
        className='dark:from-dark-background/35 dark:via-dark-background/55 dark:to-dark-background/95 absolute inset-0 z-1 bg-linear-to-b from-background/35 via-background/55 via-50% to-background/95'
      />
      <div
        aria-hidden
        className='dark:from-dark-background/80 dark:via-dark-background/20 absolute inset-y-0 left-0 z-1 hidden w-1/2 bg-linear-to-r from-background/80 via-background/20 to-transparent md:block'
      />
      <div className='relative z-10 mx-auto flex min-h-[calc(100svh-70px)] w-full max-w-350 flex-col items-start justify-center px-6 pt-20 pb-16 md:px-12 md:pt-24 lg:px-20 xl:min-h-[calc(100svh-86px)]'>
        <div className='max-w-2xl'>
          <div
            className='mb-5 aspect-1281/312 h-11 text-foreground drop-shadow-lg sm:h-14 md:mb-6 md:h-16 lg:h-20'
            aria-hidden='true'
          >
            <UtekosWordmark className='size-full text-foreground' />
          </div>
          <h1
            id='hero-headline'
            className='text-left font-google-sans font-sans text-4xl leading-[0.92] font-bold tracking-[-0.01em] drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl'
          >
            <span className='block whitespace-nowrap text-foreground'>
              Skreddersy varmen.
            </span>
            <span className='dark:text-dark-primary mt-3 block max-w-4xl text-left font-google-sans font-sans text-3xl font-bold text-primary italic sm:text-4xl md:text-5xl lg:text-6xl'>
              Forleng kvelden.
            </span>
          </h1>

          <p className='leading-text-paragraph mt-7 max-w-xl font-sans text-base tracking-tight text-foreground/90 drop-shadow-md md:text-lg lg:text-xl'>
            <span className='block'>Kompromissløs komfort</span>
            <span className='block'>
              og overlegen allsidighet.
            </span>
          </p>

          <HeroActions />

          <div
            className='mt-9 flex items-center gap-3 text-sm text-foreground md:text-[15px]'
            aria-label='Kundeanmeldelser'
          >
            <HeroStars />
            <span className='font-utekos-text-medium text-foreground'>
              {techDownReviewSummary.ratingValue.toFixed(1)}/5
            </span>
          </div>

          {defaultVariant ?
            <div className='mt-5 space-y-3'>
              <p
                className='leading-text-paragraph flex w-fit max-w-full flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs font-medium tracking-normal text-foreground/80 md:text-sm'
                aria-live='polite'
              >
                <span>
                  {formatPrice(defaultVariant.commerce.price)}
                </span>
                <span aria-hidden>·</span>
                <span>
                  {defaultVariant.commerce.availableForSale ?
                    'På lager'
                  : 'Utsolgt'}
                </span>
                <span aria-hidden>·</span>
                <span>Rask levering</span>
              </p>

              {klarnaPurchaseAmount ?
                <div
                  role='group'
                  aria-label='Betalingsinformasjon fra Klarna'
                  className='max-w-md overflow-hidden rounded-xl bg-white text-black'
                >
                  <KlarnaCreditPromotionAutoSize
                    id='klarna-credit-promotion-skreddersy-varmen-hero'
                    className='klarna-osm-light'
                    purchaseAmount={klarnaPurchaseAmount}
                    theme='default'
                  />
                </div>
              : null}
            </div>
          : null}
        </div>
      </div>

      {klarnaPurchaseAmount ?
        <KlarnaOnSiteMessagingScript />
      : null}
    </section>
  )
}
