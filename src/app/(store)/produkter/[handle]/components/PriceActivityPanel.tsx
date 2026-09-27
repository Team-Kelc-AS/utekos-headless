import Image from 'next/image'
import { Price } from '@/components/jsx/Price'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { Star } from 'lucide-react'
import { techDownReviewBundle } from '@/db/data/reviews/productReviews'
import type { CurrencyCode } from 'types/commerce/CurrencyCode'

export interface PriceActivityPanelProps {
  productHandle: string
  priceAmount: string
  currencyCode: CurrencyCode
}

const OFFERS = {
  'comfyrobe': {
    label: 'Tilbud',
    fixedSavings: null,
    originalPrice: 1690,
    description: null
  }
} as const

function getProductReviewSummary(productHandle: string) {
  if (productHandle !== 'utekos-techdown') return null

  const averageRating = techDownReviewBundle.aggregateRating.ratingValue

  return {
    averageRating,
    count: techDownReviewBundle.aggregateRating.reviewCount,
    formattedAverage: averageRating.toLocaleString('nb-NO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
}

export default function PriceActivityPanel({
  productHandle,
  priceAmount,
  currencyCode
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
            className='text-ml font-sans font-semibold gap-2 border border-card/40 px-6 py-2 text-foreground shadow-[0_12px_28px_-22px_rgba(32,28,54,0.72)] sm:px-5 sm:py-2'
          >
            {currentOffer.label}
          </BrandBadge>
          <BrandBadge
            label={`Spar ${Math.round(savingsAmount)},-`}
            backgroundColor='var(--card)'
            className='text-ml font-sans font-semibold border border-card/40 px-4 py-2 text-foreground sm:px-5 sm:py-2.5'
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
                <div className='font-sans font-semibold text-lg text-foreground line-through'>
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
          <div className='flex flex-col items-start gap-y-2.5 md:flex-row md:flex-wrap md:items-center md:gap-x-2 md:gap-y-1'>
            <span className='my-1 inline-flex h-5 w-[6.5rem] shrink-0 items-center md:my-0 md:h-4 md:w-[5.25rem]'>
              <Image
                src='/judge_me.svg'
                alt=''
                width={277}
                height={53}
                unoptimized
                className='h-5 w-auto md:h-4'
              />
            </span>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
              <div
                className='flex items-center gap-0.5 text-primary'
                aria-hidden='true'
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className='size-4 fill-primary text-primary'
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
        </div>
      )}
    </article>
  )
}
