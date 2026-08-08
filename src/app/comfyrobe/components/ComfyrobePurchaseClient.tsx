'use client'

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent
} from 'react'
import Link from 'next/link'
import { Check, Ruler, ShoppingBag } from 'lucide-react'
import { AddToCart } from '@/components/cart/AddToCart'
import { reportCanonicalVariantSelect } from '@/lib/analytics/variantSelectReporter'
import { reportCanonicalViewItem } from '@/lib/analytics/viewItemReporter'
import { createViewItemReportKey } from '@/lib/analytics/viewItemReportKey'
import { ComfyrobePurchaseImageCarousel } from './ComfyrobePurchaseImageCarousel'
import { formatComfyrobeMoney } from '../lib/buildComfyrobeOfferSummary'
import { reportComfyrobePurchaseSelection } from '../lib/reportComfyrobePurchaseSelection'
import type { ComfyrobePurchaseModel } from '../lib/buildComfyrobePurchaseModel'
import type { ProductPurchaseVariant } from 'types/product/ProductPurchaseModel'

type LocalSelection = {
  productId: string
  variantId: string
}

function hasOptionValue(
  variant: ProductPurchaseVariant,
  optionName: string,
  value: string
): boolean {
  return variant.selectedOptions.some(
    option =>
      option.name === optionName && option.value === value
  )
}

function findVariantForOptionChange({
  variants,
  currentVariant,
  optionName,
  optionValue
}: {
  variants: ProductPurchaseVariant[]
  currentVariant: ProductPurchaseVariant
  optionName: string
  optionValue: string
}): ProductPurchaseVariant | null {
  const currentOptions = new Map(
    currentVariant.selectedOptions.map(option => [
      option.name,
      option.value
    ])
  )

  const exactVariant = variants.find(candidate => {
    if (
      candidate.selectedOptions.length !==
      currentVariant.selectedOptions.length
    ) {
      return false
    }

    return candidate.selectedOptions.every(option => {
      const expectedValue =
        option.name === optionName ?
          optionValue
        : currentOptions.get(option.name)

      return option.value === expectedValue
    })
  })

  if (exactVariant) return exactVariant

  const matchingVariants = variants.filter(variant =>
    hasOptionValue(variant, optionName, optionValue)
  )

  return (
    matchingVariants.find(
      variant => variant.availableForSale
    ) ??
    matchingVariants[0] ??
    null
  )
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

function reportSizeGuideSelection() {
  reportComfyrobePurchaseSelection(
    'Se størrelsesguide',
    'purchase_size_guide'
  )
}

export function ComfyrobePurchaseClient({
  model
}: {
  model: ComfyrobePurchaseModel
}) {
  const { product, initialVariantId, sizeOption } = model
  const [selection, setSelection] =
    useState<LocalSelection | null>(null)
  const reportedViewItemKey = useRef<string | null>(null)
  const sizeButtonRefs = useRef<
    Array<HTMLButtonElement | null>
  >([])

  const selectedVariantId =
    selection?.productId === product.id ?
      selection.variantId
    : initialVariantId
  const selectedVariant =
    product.variants.find(
      variant => variant.id === selectedVariantId
    ) ?? null
  const selectedPresentation =
    selectedVariant ?
      (model.variantPresentation.find(
        presentation =>
          presentation.variantId === selectedVariant.id
      ) ?? null)
    : null
  const sizeChoices =
    sizeOption?.choices.map(choice => ({
      ...choice,
      selected:
        selectedVariant ?
          hasOptionValue(
            selectedVariant,
            sizeOption.name,
            choice.value
          )
        : false
    })) ?? []

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
      <section className='bg-jungle text-foreground px-6 py-20'>
        <div className='mx-auto max-w-3xl text-center'>
          <h2 className='font-google-sans font-sans text-3xl font-bold'>
            Comfyrobe™ er midlertidig utsolgt
          </h2>
          <p className='mt-4 font-utekos-text text-foreground/90'>
            Produktet kan ikke bestilles før Shopify rapporterer
            en tilgjengelig variant.
          </p>
        </div>
      </section>
    )
  }

  const updateVariant = (
    optionName: string,
    optionValue: string
  ) => {
    const nextVariant = findVariantForOptionChange({
      variants: product.variants,
      currentVariant: selectedVariant,
      optionName,
      optionValue
    })

    if (!nextVariant || nextVariant.id === selectedVariant.id) {
      return
    }

    setSelection({
      productId: product.id,
      variantId: nextVariant.id
    })

    try {
      reportCanonicalVariantSelect({
        customData: {
          interaction_id: createInteractionId(),
          product_id: product.id,
          variant_id: nextVariant.id,
          item_id: nextVariant.id,
          item_variant: nextVariant.title,
          availability:
            nextVariant.availableForSale ?
              'available'
            : 'unavailable'
        }
      })
    } catch {
      // Analytics must never block the purchase interaction.
    }
  }

  const handleSizeKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    const availableIndices = sizeChoices.flatMap(
      (choice, index) => (choice.available ? [index] : [])
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
        event.key === 'ArrowRight' ||
        event.key === 'ArrowDown' ?
          1
        : -1
      const currentPosition = Math.max(
        availableIndices.indexOf(currentIndex),
        0
      )
      nextIndex =
        availableIndices[
          (currentPosition +
            direction +
            availableIndices.length) %
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

  const color = selectedPresentation?.color ?? null
  const gender = selectedPresentation?.gender ?? null
  const savings = selectedPresentation?.savings ?? null

  return (
    <section
      aria-labelledby='purchase-heading'
      className='w-full bg-jungle md:px-8 md:rounded-xl md:py-12 lg:py-16 lg:px-12 mx-auto text-foreground'
    >
      <div className='grid min-h-190 overflow-hidden rounded-lg lg:grid-cols-2'>
        <ComfyrobePurchaseImageCarousel />

        <div className='flex flex-col'>
          <div className='flex-1 bg-background px-6 py-14 text-foreground md:px-12 lg:px-16 lg:py-18'>
            <p className='font-utekos-text-medium text-sm tracking-wide text-primary'>
              Comfyrobe™
            </p>
            <h2
              id='purchase-heading'
              className='font-google-sans mt-3 max-w-[11ch] font-sans text-5xl leading-[0.92] font-bold tracking-tight text-foreground md:text-6xl'
            >
              Juster, form og nyt.
            </h2>
            <p className='mt-6 max-w-xl font-utekos-text text-lg leading-relaxed text-foreground/78'>
              Roben for deg som ønsker en kombinasjon av teknisk
              ytelse, kompromissløs komfort og tidløst design.
            </p>

            <div
              className='mt-8 flex flex-wrap items-end gap-x-4 gap-y-2'
              aria-live='polite'
            >
              <span className='font-google-sans font-sans text-5xl font-bold text-foreground tabular-nums'>
                {formatComfyrobeMoney(selectedVariant.price)}
              </span>
              {savings && selectedVariant.compareAtPrice ?
                <>
                  <span className='pb-1 text-lg text-foreground/60 line-through'>
                    {formatComfyrobeMoney(
                      selectedVariant.compareAtPrice
                    )}
                  </span>
                  <span className='font-google-sans mb-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground'>
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
                  <legend className='font-google-sans font-utekos-text-medium font-bold'>
                    Størrelse
                  </legend>
                  <Link
                    href='/handlehjelp/storrelsesguide#comfyrobe-size-guide'
                    data-track='ComfyrobePurchaseSizeGuide'
                    onClick={reportSizeGuideSelection}
                    className='inline-flex min-h-11 items-center gap-2 font-utekos-text-medium text-sm underline underline-offset-4'
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
                        'relative min-h-14 rounded-2xl border px-3 py-3 text-center font-utekos-text-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary',
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

          <div className='border-t border-background/15 bg-background p-6 text-card-foreground md:p-10'>
            {selectedVariant.availableForSale ?
              <AddToCart
                product={product}
                selectedVariant={selectedVariant}
                checkoutPresentation='standard-primary'
                showAddToCartAction={false}
              />
            : <div className='rounded-2xl border border-border p-5 text-center'>
                <ShoppingBag
                  className='mx-auto size-6'
                  aria-hidden
                />
                <p className='mt-3 font-utekos-text-medium'>
                  Valgt størrelse er utsolgt
                </p>
              </div>
            }
            <p className='mt-5 text-center text-sm text-card-foreground/70'>
              Sikker betaling · Rask levering · 14 dagers retur
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
