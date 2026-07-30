'use client'

import { reportCanonicalAddToWishlist } from './addToWishlistReporter'
import {
  addWishlistItem,
  type StorageLike
} from '@/lib/wishlist/wishlistStore'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type PersistAndReportAddToWishlistInput = {
  product: ProductCartModel
  storage?: StorageLike
  variant: ProductPurchaseVariant | null | undefined
}

export type PersistAndReportAddToWishlistResult = {
  alreadyPresent: boolean
  emitted: boolean
  persisted: boolean
}

/**
 * Persist first, then emit. Never throws to UI. Does not emit when the variant
 * was already in the wishlist or when persistence fails.
 */
export function persistAndReportAddToWishlist(
  input: PersistAndReportAddToWishlistInput
): PersistAndReportAddToWishlistResult {
  if (!input.variant) {
    return { emitted: false, persisted: false, alreadyPresent: false }
  }

  try {
    const result = addWishlistItem({
      productId: input.product.id,
      variantId: input.variant.id,
      productHandle: input.product.handle,
      ...(input.storage ? { storage: input.storage } : {})
    })

    if (!result) {
      return { emitted: false, persisted: false, alreadyPresent: false }
    }

    if (!result.added) {
      return {
        emitted: false,
        persisted: true,
        alreadyPresent: true
      }
    }

    reportCanonicalAddToWishlist({
      product: input.product,
      variant: input.variant,
      wishlistMutationId: result.mutationId
    })

    return {
      emitted: true,
      persisted: true,
      alreadyPresent: false
    }
  } catch {
    return { emitted: false, persisted: false, alreadyPresent: false }
  }
}
