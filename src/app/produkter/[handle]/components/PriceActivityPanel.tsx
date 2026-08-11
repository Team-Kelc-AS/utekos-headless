import { Price } from '@/components/jsx/Price'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { Star } from 'lucide-react'
import { techDownReviewSummary } from '@/app/skreddersy-varmen/data/reviews'
import type { ReactNode } from 'react'
import type { CurrencyCode } from 'types/commerce/CurrencyCode'

export interface PriceActivityPanelProps {
  productHandle: string
  priceAmount: string
  currencyCode: CurrencyCode
  activityNode?: ReactNode
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

function getProductReviewSummary(productHandle: string) {
  if (productHandle !== 'utekos-techdown') return null

  const averageRating = techDownReviewSummary.ratingValue

  return {
    averageRating,
    count: techDownReviewSummary.reviewCount,
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
  activityNode
}: PriceActivityPanelProps) {
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
