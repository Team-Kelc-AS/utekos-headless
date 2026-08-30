import 'server-only'

import { fetchProductCardsWithRetry } from '@/api/lib/products/fetchProductCardsWithRetry'
import {
  deleteRelatedProductsSnapshot,
  getRelatedProductsSnapshot,
  setRelatedProductsSnapshot
} from '@/lib/cache/relatedProductsRuntimeCache'
import { getRelatedProducts } from '@/hooks/getRelatedProducts'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import type { RuntimeCache } from '@vercel/functions'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

function logRelatedProductsWarning(
  event: string,
  error: unknown,
  context: Record<string, unknown>
) {
  console.warn(
    JSON.stringify({
      event,
      level: 'WARN',
      error:
        error instanceof Error ? error.message : String(error),
      context: { ...context, runtime: getVercelRuntimeContext() }
    })
  )
}

export async function loadRelatedProducts(
  currentHandle: string,
  limit: number = 12,
  dependencies: {
    fetchProductCardsWithRetry?: typeof fetchProductCardsWithRetry
    deleteSnapshot?: typeof deleteRelatedProductsSnapshot
    getSnapshot?: typeof getRelatedProductsSnapshot
    setSnapshot?: typeof setRelatedProductsSnapshot
    runtimeCache?: RuntimeCache
  } = {}
): Promise<ProductCardModel[]> {
  const fetchCards =
    dependencies.fetchProductCardsWithRetry ??
    fetchProductCardsWithRetry
  const getSnapshot =
    dependencies.getSnapshot ?? getRelatedProductsSnapshot
  const deleteSnapshot =
    dependencies.deleteSnapshot ?? deleteRelatedProductsSnapshot
  const setSnapshot =
    dependencies.setSnapshot ?? setRelatedProductsSnapshot

  try {
    const allProducts = await fetchCards({
      first: Math.max(limit * 2, 24)
    })
    const related = getRelatedProducts(
      allProducts,
      currentHandle,
      limit
    )

    if (related.length > 0) {
      await setSnapshot(
        currentHandle,
        related,
        dependencies.runtimeCache
      )
    } else {
      await deleteSnapshot(
        currentHandle,
        dependencies.runtimeCache
      )
    }

    return related
  } catch (error) {
    const snapshot = await getSnapshot(
      currentHandle,
      dependencies.runtimeCache
    )

    if (snapshot && snapshot.length > 0) {
      logRelatedProductsWarning(
        'pdp.related_products.served_last_good',
        error,
        { handle: currentHandle, count: snapshot.length }
      )
      return snapshot
    }

    logRelatedProductsWarning(
      'pdp.related_products.fetch_failed',
      error,
      { handle: currentHandle }
    )
    return []
  }
}
