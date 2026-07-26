'use client'

import { useState } from 'react'
import { flattenConnection } from '@shopify/hydrogen-react'
import { reportCanonicalVariantSelect } from '@/lib/analytics/variantSelectReporter'
import { findInitialVariant } from '@/lib/utils/findInitialVariant'
import { selectVariantByOptions } from '@/lib/utils/selectVariantByOptions'
import type { ShopifyProduct } from 'types/product'

type LocalSelection = { productId: string; variantId: string }

export function useLocalVariantSelection(
  product: ShopifyProduct | undefined,
  initialVariantId: string | null = null
) {
  const [selection, setSelection] =
    useState<LocalSelection | null>(null)
  const allVariants =
    product ? flattenConnection(product.variants) : []
  const initialVariant = findInitialVariant(
    allVariants,
    initialVariantId
  )
  const selectedVariant =
    product && selection?.productId === product.id ?
      (allVariants.find(
        variant => variant.id === selection.variantId
      ) ?? initialVariant)
    : initialVariant

  function updateVariant(optionName: string, value: string) {
    if (!product || !selectedVariant) return

    const nextVariant = selectVariantByOptions(allVariants, {
      current: selectedVariant,
      optionName,
      value
    })

    if (!nextVariant || nextVariant.id === selectedVariant.id) {
      return
    }

    setSelection({
      productId: product.id,
      variantId: nextVariant.id
    })

    reportCanonicalVariantSelect({
      customData: {
        interaction_id: globalThis.crypto.randomUUID(),
        product_id: product.id,
        variant_id: nextVariant.id,
        item_id: nextVariant.id,
        item_variant: nextVariant.title,
        availability:
          nextVariant.availableForSale ? 'available' : (
            'unavailable'
          )
      }
    })
  }

  return { allVariants, selectedVariant, updateVariant }
}
