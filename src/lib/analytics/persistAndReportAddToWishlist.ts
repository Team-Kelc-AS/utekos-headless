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
      // #region agent log
      fetch(
        'http://127.0.0.1:7626/ingest/3d726327-2da6-4157-aa0a-bb33dbbbefd1',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '2aed25'
          },
          body: JSON.stringify({
            sessionId: '2aed25',
            runId: 'pre-fix',
            hypothesisId: 'H2',
            location: 'persistAndReportAddToWishlist.ts:alreadyPresent',
            message: 'wishlist already present, no emit',
            data: { added: false, persisted: true },
            timestamp: Date.now()
          })
        }
      ).catch(() => {})
      // #endregion
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

    // #region agent log
    fetch(
      'http://127.0.0.1:7626/ingest/3d726327-2da6-4157-aa0a-bb33dbbbefd1',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '2aed25'
        },
        body: JSON.stringify({
          sessionId: '2aed25',
          runId: 'pre-fix',
          hypothesisId: 'H2',
          location: 'persistAndReportAddToWishlist.ts:emitted',
          message: 'wishlist persisted and reporter invoked',
          data: { added: true, persisted: true },
          timestamp: Date.now()
        })
      }
    ).catch(() => {})
    // #endregion

    return {
      emitted: true,
      persisted: true,
      alreadyPresent: false
    }
  } catch {
    // #region agent log
    fetch(
      'http://127.0.0.1:7626/ingest/3d726327-2da6-4157-aa0a-bb33dbbbefd1',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '2aed25'
        },
        body: JSON.stringify({
          sessionId: '2aed25',
          runId: 'pre-fix',
          hypothesisId: 'H2',
          location: 'persistAndReportAddToWishlist.ts:catch',
          message: 'wishlist persist/report threw',
          data: { emitted: false },
          timestamp: Date.now()
        })
      }
    ).catch(() => {})
    // #endregion
    return { emitted: false, persisted: false, alreadyPresent: false }
  }
}
