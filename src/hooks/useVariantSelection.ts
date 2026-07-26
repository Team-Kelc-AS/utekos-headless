'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { flattenConnection } from '@shopify/hydrogen-react'
import { createVariantSelectionUrl } from '@/lib/shopify/product-options/createVariantSelectionUrl'
import { reportCanonicalVariantSelect } from '@/lib/analytics/variantSelectReporter'
import type { UtekosProductOptions } from '@/lib/shopify/product-options/types'
import type { Route } from 'next'
import type {
  ShopifyProduct,
  ShopifyProductVariant
} from 'types/product'

type PendingSelection = {
  sourceVariantId: string
  variantId: string
  availableForSale: boolean
  optionName: string
  optionValue: string
}

type UseVariantSelectionInput = {
  product: ShopifyProduct | undefined
  productOptions: UtekosProductOptions
}

export function useVariantSelection({
  product,
  productOptions
}: UseVariantSelectionInput) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null)
  const navigationLockRef = useRef(false)

  const allVariants =
    product ? flattenConnection(product.variants) : []
  const isVariantNavigationPending = Boolean(
    pendingSelection &&
    pendingSelection.sourceVariantId ===
      productOptions.selectedVariantId
  )
  const selectedVariantId =
    isVariantNavigationPending && pendingSelection ?
      pendingSelection.variantId
    : productOptions.selectedVariantId
  const selectedVariantAvailability =
    isVariantNavigationPending && pendingSelection ?
      pendingSelection.availableForSale
    : productOptions.selectedVariantAvailableForSale
  const domainVariant = allVariants.find(
    variant => variant.id === selectedVariantId
  )
  const selectedVariant: ShopifyProductVariant | null =
    domainVariant ?
      {
        ...domainVariant,
        availableForSale: selectedVariantAvailability
      }
    : null

  useEffect(() => {
    if (!isVariantNavigationPending) {
      navigationLockRef.current = false
    }
  }, [isVariantNavigationPending])

  useEffect(() => {
    if (!pendingSelection || isVariantNavigationPending) return

    const optionName = CSS.escape(pendingSelection.optionName)
    const optionValue = CSS.escape(pendingSelection.optionValue)
    const frame = window.requestAnimationFrame(() => {
      const optionButton =
        document.querySelector<HTMLButtonElement>(
          `[data-product-option-name="${optionName}"][data-product-option-value="${optionValue}"]`
        )

      optionButton?.focus()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isVariantNavigationPending, pendingSelection])

  function updateVariant(optionName: string, value: string) {
    if (
      !product ||
      isVariantNavigationPending ||
      navigationLockRef.current ||
      !selectedVariant
    )
      return

    const option = productOptions.options.find(
      candidate => candidate.name === optionName
    )
    const optionValue = option?.optionValues.find(
      candidate => candidate.name === value
    )

    if (
      !optionValue?.exists ||
      !optionValue.variantId ||
      optionValue.isDifferentProduct ||
      optionValue.variantId === selectedVariant.id
    ) {
      return
    }

    const nextVariant = allVariants.find(
      variant => variant.id === optionValue.variantId
    )

    if (!nextVariant) return

    navigationLockRef.current = true
    setPendingSelection({
      sourceVariantId: selectedVariant.id,
      variantId: nextVariant.id,
      availableForSale: optionValue.variantAvailableForSale,
      optionName,
      optionValue: value
    })

    const nextUrl = createVariantSelectionUrl({
      handle: product.handle,
      variantId: nextVariant.id,
      optionNames: product.options.map(
        productOption => productOption.name
      ),
      searchParams
    })

    router.replace(nextUrl as Route, { scroll: false })

    reportCanonicalVariantSelect({
      customData: {
        interaction_id: globalThis.crypto.randomUUID(),
        product_id: product.id,
        variant_id: nextVariant.id,
        item_id: nextVariant.id,
        item_variant: nextVariant.title,
        availability:
          optionValue.variantAvailableForSale ? 'available' : (
            'unavailable'
          )
      }
    })
  }

  return {
    allVariants,
    selectedVariant,
    updateVariant,
    isVariantNavigationPending
  }
}
