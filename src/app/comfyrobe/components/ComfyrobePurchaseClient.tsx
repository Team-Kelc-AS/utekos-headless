'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Check, Ruler, ShoppingBag } from 'lucide-react'
import { AddToCart } from '@/components/cart/AddToCart'
import { useVariantState } from '@/hooks/useVariantState'
import { reportCanonicalViewItem } from '@/lib/analytics/viewItemReporter'
import { createViewItemReportKey } from '@/lib/analytics/viewItemReportKey'
import { flattenVariants } from '@/lib/utils/flattenVariants'
import { ComfyrobePurchaseImageCarousel } from './ComfyrobePurchaseImageCarousel'
import { formatComfyrobeMoney } from '../lib/buildComfyrobeOfferSummary'
import { reportComfyrobePurchaseSelection } from '../lib/reportComfyrobePurchaseSelection'
import type {
  ShopifyProduct,
  ShopifyProductVariant
} from 'types/product'

function getSavings(variant: ShopifyProductVariant) {
  const price = Number(variant.price.amount)
  const compareAtPrice = Number(variant.compareAtPrice?.amount)

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(compareAtPrice) ||
    variant.compareAtPrice?.currencyCode !==
      variant.price.currencyCode ||
    compareAtPrice <= price
  ) {
    return null
  }

  return {
    amount: {
      amount: String(compareAtPrice - price),
      currencyCode: variant.price.currencyCode
    },
    percentage: Math.round(
      ((compareAtPrice - price) / compareAtPrice) * 100
    )
  }
}

function hasOptionValue(
  variant: ShopifyProductVariant,
  optionName: string,
  value: string
) {
  return variant.selectedOptions.some(
    option =>
      option.name === optionName && option.value === value
  )
}

function reportSizeGuideSelection() {
  reportComfyrobePurchaseSelection(
    'Se størrelsesguide',
    'purchase_size_guide'
  )
}

export function ComfyrobePurchaseClient({
  product
}: {
  product: ShopifyProduct
}) {
  const variants = flattenVariants(product)
  const initialAvailableVariant =
    variants.find(variant => variant.availableForSale) ??
    variants[0] ??
    null
  const { variantState, updateVariant, allVariants } =
    useVariantState(
      product,
      false,
      initialAvailableVariant?.id ?? null
    )
  const reportedViewItemKey = useRef<string | null>(null)
  const sizeButtonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedVariant =
    variantState.status === 'selected' ?
      variantState.variant
    : initialAvailableVariant

  useEffect(() => {
    if (!selectedVariant) return

    const reportKey = createViewItemReportKey(
      product.id,
      selectedVariant.id
    )
    if (reportedViewItemKey.current === reportKey) return

    return reportCanonicalViewItem({
      product,
      variant: selectedVariant,
      onEmitted: () => {
        reportedViewItemKey.current = reportKey
      }
    })
  }, [product, selectedVariant])

  if (!selectedVariant) {
    return (
      <section className='bg-foreground px-6 py-20 text-background dark:bg-dark-foreground dark:text-dark-background'>
        <div className='mx-auto max-w-3xl text-center'>
          <h2 className='font-sans text-3xl font-bold'>
            Comfyrobe™ er midlertidig utsolgt
          </h2>
          <p className='mt-4 font-utekos-text text-background/80 dark:text-dark-background/80'>
            Produktet kan ikke bestilles før Shopify rapporterer
            en tilgjengelig variant.
          </p>
        </div>
      </section>
    )
  }

  const sizeOption = product.options.find(
    option => option.name === 'Størrelse'
  )
  const sizeChoices =
    sizeOption?.optionValues.map(optionValue => {
      const value = optionValue.name
      const matchingVariants = allVariants.filter(variant =>
        hasOptionValue(variant, sizeOption.name, value)
      )

      return {
        value,
        available: matchingVariants.some(
          variant => variant.availableForSale
        ),
        selected: hasOptionValue(
          selectedVariant,
          sizeOption.name,
          value
        )
      }
    }) ?? []
  const color = selectedVariant.selectedOptions.find(
    option => option.name === 'Farge'
  )?.value
  const gender = selectedVariant.selectedOptions.find(
    option => option.name === 'Kjønn'
  )?.value
  const savings = getSavings(selectedVariant)

  const handleSizeKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    const availableIndices = sizeChoices.flatMap((choice, index) =>
      choice.available ? [index] : []
    )
    if (availableIndices.length === 0) return

    let nextIndex: number | null = null
    if (event.key === 'Home') {
      nextIndex = availableIndices[0] ?? null
    } else if (event.key === 'End') {
      nextIndex = availableIndices.at(-1) ?? null
    } else if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowUp'
    ) {
      const direction =
        event.key === 'ArrowRight' || event.key === 'ArrowDown' ?
          1
        : -1
      const currentPosition = Math.max(
        availableIndices.indexOf(currentIndex),
        0
      )
      nextIndex =
        availableIndices[
          (currentPosition + direction + availableIndices.length) %
            availableIndices.length
        ] ?? null
    }

    if (nextIndex === null || !sizeOption) return

    event.preventDefault()
    const nextChoice = sizeChoices[nextIndex]
    if (!nextChoice) return

    updateVariant(sizeOption.name, nextChoice.value)
    sizeButtonRefs.current[nextIndex]?.focus()
  }

  return (
    <section
      aria-labelledby='purchase-heading'
      className='w-full bg-foreground text-background dark:bg-dark-foreground dark:text-dark-background'
    >
      <div className='grid min-h-190 lg:grid-cols-2'>
        <ComfyrobePurchaseImageCarousel />

        <div className='flex flex-col'>
          <div className='flex-1 bg-background px-6 py-14 text-foreground md:px-12 lg:px-16 lg:py-18'>
            <p className='font-utekos-text-medium text-sm tracking-wide text-primary dark:text-[oklch(0.78_0.15_67)]'>
              Din Comfyrobe™
            </p>
            <h2
              id='purchase-heading'
              className='mt-3 max-w-[11ch] font-sans text-5xl leading-[0.92] font-bold tracking-tight text-foreground md:text-6xl'
            >
              Velg størrelsen din.
            </h2>
            <p className='mt-6 max-w-xl font-utekos-text text-lg leading-relaxed text-foreground/78'>
              Romslig unisex-passform. Sjekk størrelsesguiden før
              du velger.
            </p>

            <div
              className='mt-8 flex flex-wrap items-end gap-x-4 gap-y-2'
              aria-live='polite'
            >
              <span className='font-sans text-5xl font-bold text-foreground tabular-nums'>
                {formatComfyrobeMoney(selectedVariant.price)}
              </span>
              {savings && selectedVariant.compareAtPrice ?
                <>
                  <span className='pb-1 text-lg text-foreground/60 line-through'>
                    {formatComfyrobeMoney(
                      selectedVariant.compareAtPrice
                    )}
                  </span>
                  <span className='mb-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground dark:text-foreground'>
                    Spar {formatComfyrobeMoney(savings.amount)} ·{' '}
                    {savings.percentage} %
                  </span>
                </>
              : null}
            </div>

            <p className='mt-4 flex items-center gap-2 font-utekos-text-medium text-sm'>
              <span
                className={
                  selectedVariant.availableForSale ?
                    'size-2 rounded-full bg-emerald-600'
                  : 'size-2 rounded-full bg-destructive'
                }
                aria-hidden
              />
              {selectedVariant.availableForSale ?
                'På lager'
              : 'Midlertidig utsolgt'}
            </p>

            {color || gender ?
              <dl className='mt-8 grid border-y border-foreground/12 sm:grid-cols-2 sm:divide-x sm:divide-foreground/12'>
                {color ?
                  <div className='py-4 sm:pr-5'>
                    <dt className='text-xs text-foreground/60'>
                      Farge
                    </dt>
                    <dd className='mt-1 font-utekos-text-medium'>
                      {color}
                    </dd>
                  </div>
                : null}
                {gender ?
                  <div className='border-t border-foreground/12 py-4 sm:border-t-0 sm:pl-5'>
                    <dt className='text-xs text-foreground/60'>
                      Passform
                    </dt>
                    <dd className='mt-1 font-utekos-text-medium'>
                      {gender}
                    </dd>
                  </div>
                : null}
              </dl>
            : null}

            {sizeOption ?
              <fieldset className='mt-9'>
                <div className='flex items-center justify-between gap-4'>
                  <legend className='font-utekos-text-medium font-bold'>
                    Størrelse
                  </legend>
                  <Link
                    href='/handlehjelp/storrelsesguide'
                    data-track='ComfyrobePurchaseSizeGuide'
                    onClick={reportSizeGuideSelection}
                    className='inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4'
                  >
                    <Ruler className='size-4' aria-hidden />
                    Se størrelsesguide
                  </Link>
                </div>
                <div
                  className='mt-4 grid grid-cols-3 gap-3'
                  role='radiogroup'
                  aria-label='Velg størrelse'
                >
                  {sizeChoices.map((choice, index) => (
                    <button
                      key={choice.value}
                      ref={element => {
                        sizeButtonRefs.current[index] = element
                      }}
                      type='button'
                      role='radio'
                      aria-checked={choice.selected}
                      aria-disabled={!choice.available}
                      disabled={!choice.available}
                      tabIndex={choice.selected ? 0 : -1}
                      onClick={() =>
                        choice.available &&
                        updateVariant(
                          sizeOption.name,
                          choice.value
                        )
                      }
                      onKeyDown={event =>
                        handleSizeKeyDown(event, index)
                      }
                      className={[
                        'relative min-h-14 rounded-2xl border px-3 py-3 text-center font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary',
                        choice.selected ?
                          'border-foreground bg-foreground text-background'
                        : 'border-foreground/20 text-foreground',
                        choice.available ?
                          'hover:border-primary'
                        : 'cursor-not-allowed opacity-45'
                      ].join(' ')}
                    >
                      <span className='flex items-center justify-center gap-2'>
                        {choice.value}
                        {choice.selected ?
                          <Check
                            className='size-4'
                            aria-hidden
                          />
                        : null}
                      </span>
                      {!choice.available ?
                        <span className='mt-1 block text-[10px] tracking-wide'>
                          Utsolgt
                        </span>
                      : null}
                    </button>
                  ))}
                </div>
              </fieldset>
            : null}
          </div>

          <div className='border-t border-background/15 bg-card p-6 text-card-foreground md:p-10'>
            {selectedVariant.availableForSale ?
              <AddToCart
                product={product}
                selectedVariant={selectedVariant}
                checkoutPresentation='standard-primary'
              />
            : <div className='rounded-2xl border border-border p-5 text-center'>
                <ShoppingBag
                  className='mx-auto size-6'
                  aria-hidden
                />
                <p className='mt-3 font-semibold'>
                  Valgt størrelse er utsolgt
                </p>
              </div>
            }
            <p className='mt-5 text-center text-sm text-card-foreground/70'>
              Sikker betaling · 14 dagers retur
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
