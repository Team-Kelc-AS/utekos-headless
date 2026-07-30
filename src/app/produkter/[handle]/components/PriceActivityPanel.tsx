import { Price } from '@/components/jsx/Price'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { ShieldAlert, Star } from 'lucide-react'
import { reviews } from '@/app/skreddersy-varmen/data/reviews'
import type { ReactNode } from 'react'
import type { CurrencyCode } from 'types/commerce/CurrencyCode'

export interface PriceActivityPanelProps {
  productHandle: string
  priceAmount: string
  currencyCode: CurrencyCode
  activityNode?: ReactNode
  limitedStockCount?: number
}

const OFFERS = {
  'utekos-mikrofiber': {
    label: 'Tilbud',
    fixedSavings: null,
    originalPrice: 2290,
    description: null
  },
  'comfyrobe': {
    label: 'Tilbud',
    fixedSavings: null,
    originalPrice: 1690,
    description: null
  }
} as const

const REVIEW_PRODUCT_BY_HANDLE = {
  'utekos-techdown': 'Utekos TechDown',
  'utekos-mikrofiber': 'Utekos Mikrofiber'
} as const

function getProductReviewSummary(productHandle: string) {
  const reviewProductName =
    REVIEW_PRODUCT_BY_HANDLE[
      productHandle as keyof typeof REVIEW_PRODUCT_BY_HANDLE
    ]

  if (!reviewProductName) return null

  const productReviews = reviews.filter(
    review => review.product === reviewProductName
  )

  if (!productReviews.length) return null

  const averageRating =
    productReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    ) / productReviews.length

  return {
    averageRating,
    count: productReviews.length,
    formattedAverage: averageRating.toLocaleString('nb-NO', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })
  }
}

export default function PriceActivityPanel({
  productHandle,
  priceAmount,
  currencyCode,
  activityNode,
  limitedStockCount
}: PriceActivityPanelProps) {
  const shouldShowLimitedStockNotice =
    typeof limitedStockCount === 'number' &&
    limitedStockCount > 0

  const isSpecialEdition =
    productHandle === 'utekos-special-edition'
  const reviewSummary = getProductReviewSummary(productHandle)

  // Hent konfigurasjon for produktet
  const currentOffer =
    OFFERS[productHandle as keyof typeof OFFERS]
  const hasOffer = !!currentOffer

  // Variabler for utregning
  let savingsAmount = 0
  let showBeforePrice = false
  let originalPriceToDisplay = 0

  if (hasOffer) {
    if (currentOffer.fixedSavings) {
      savingsAmount = currentOffer.fixedSavings
      showBeforePrice = false // Skjuler førpris for techdown
    } else if (currentOffer.originalPrice) {
      const currentPriceNumber = parseFloat(
        String(priceAmount)
          .replace(/[^0-9,.]/g, '')
          .replace(',', '.')
      )

      if (!isNaN(currentPriceNumber)) {
        savingsAmount =
          currentOffer.originalPrice - currentPriceNumber
        originalPriceToDisplay = currentOffer.originalPrice
        showBeforePrice = true
      }
    }
  }

  const showSavings = hasOffer && savingsAmount > 0

  return (
    <article
      aria-label='Pris og tilgjengelighet'
      className='relative'
    >
      {showSavings && (
        <div className='relative z-20 mb-4 flex flex-wrap items-center gap-3'>
          <BrandBadge
            backgroundColor='var(--card)'
            className='text-ml dark:border-dark-card/40 font-utekos-text-medium gap-2 border border-card/40 px-6 py-2 text-foreground shadow-[0_12px_28px_-22px_rgba(32,28,54,0.72)] dark:text-dark-foreground sm:px-5 sm:py-2'
          >
            {currentOffer.label}
          </BrandBadge>
          <BrandBadge
            label={`Spar ${Math.round(savingsAmount)},-`}
            backgroundColor='var(--card)'
            className='text-ml dark:border-dark-card/40 font-utekos-text-medium border border-card/40 px-4 py-2 text-foreground dark:text-dark-foreground sm:px-5 sm:py-2.5'
          />
        </div>
      )}

      <div>
        <div className='flex items-baseline gap-3'>
          {showSavings ?
            <>
              <div className='text-foreground'>
                <Price
                  amount={priceAmount}
                  currencyCode={currencyCode}
                />
              </div>

              {showBeforePrice && (
                <div className='font-utekos-text-medium text-lg text-foreground line-through'>
                  <Price
                    amount={String(originalPriceToDisplay)}
                    currencyCode={currencyCode}
                  />
                </div>
              )}
            </>
          : <div className='text-foreground'>
              <Price
                amount={priceAmount}
                currencyCode={currencyCode}
              />
            </div>
          }
        </div>

        {showSavings && currentOffer.description && (
          <p className='mt-3 text-sm text-foreground'>
            {currentOffer.description}
          </p>
        )}

        {isSpecialEdition && shouldShowLimitedStockNotice && (
          <div className='dark:border-dark-card/60  relative mt-4 overflow-hidden rounded-2xl border border-card/60 bg-card p-4'>
            <div
              className='relative flex items-center gap-3'
              style={{ zIndex: 10 }}
            >
              <div className='dark:border-dark-card/60  flex h-10 w-10 items-center justify-center rounded-full border border-card/60 bg-card text-foreground'>
                <ShieldAlert
                  className='h-5 w-5'
                  aria-hidden='true'
                />
              </div>
              <div>
                <p className='font-utekos-text-medium text-foreground'>
                  Kun {limitedStockCount} igjen på lager!
                </p>
                <p className='font-utekos-text-medium text-sm text-foreground'>
                  Unik utgave - kommer ikke tilbake
                </p>
              </div>
            </div>
            <div
              className='pointer-events-none absolute -inset-x-2 -inset-y-8 opacity-20 blur-2xl'
              style={{
                background:
                  'radial-gradient(120% 120% at 50% 0%, transparent 30%, color-mix(in oklab, var(--very-peri) 72%, transparent) 100%)'
              }}
              aria-hidden='true'
            />
          </div>
        )}
      </div>

      {reviewSummary && (
        <div
          className='mt-2 text-sm text-foreground'
          aria-label={`${reviewSummary.formattedAverage} av 5 basert på ${reviewSummary.count} anmeldelser`}
        >
          <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
            <div
              className='text-yellow-cyber flex items-center gap-0.5'
              aria-hidden='true'
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  className='size-4'
                  fill='currentColor'
                  strokeWidth={1.5}
                  opacity={
                    (
                      index <
                      Math.round(reviewSummary.averageRating)
                    ) ?
                      1
                    : 0.28
                  }
                />
              ))}
            </div>
            <span>
              {reviewSummary.formattedAverage} av 5 fra{' '}
              {reviewSummary.count} anmeldelser
            </span>
          </div>
        </div>
      )}

      {activityNode && (
        <div className='border-promo-foreground/20 dark:border-dark-promo-foreground/20 bg-promo dark:bg-dark-promo text-promo-foreground dark:text-dark-promo-foreground mt-5 rounded-[1.15rem] border px-4 pt-1.5 pb-2.5 md:mt-6'>
          {activityNode}
        </div>
      )}
    </article>
  )
}
