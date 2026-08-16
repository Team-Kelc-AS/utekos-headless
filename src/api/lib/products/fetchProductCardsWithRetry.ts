import { createShopifyRequestDeadline } from '@/api/shopify/request/createShopifyRequestDeadline'
import { fetchProductCards } from './fetchProductCards'
import { getRelatedProductsRetryJitterMs } from './getRelatedProductsRetryJitterMs'
import { isRetryableShopifyCatalogError } from './isRetryableShopifyCatalogError'
import {
  RELATED_PRODUCTS_MIN_RETRY_BUDGET_MS,
  RELATED_PRODUCTS_TOTAL_BUDGET_MS
} from './relatedProductsPolicy'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

export type FetchProductCardsAttempt = (input: {
  first: number
  timeoutMs: number
  signal: AbortSignal
}) => Promise<ProductCardModel[]>

function remainingBudgetMs(startedAt: number, budgetMs: number, now: () => number) {
  return Math.max(0, budgetMs - (now() - startedAt))
}

export async function fetchProductCardsWithRetry(input: {
  first: number
  budgetMs?: number
  fetchProductCards?: FetchProductCardsAttempt
  now?: () => number
  random?: () => number
  sleep?: (ms: number) => Promise<void>
}): Promise<ProductCardModel[]> {
  const budgetMs = input.budgetMs ?? RELATED_PRODUCTS_TOTAL_BUDGET_MS
  const now = input.now ?? (() => performance.now())
  const sleep =
    input.sleep ??
    (ms => new Promise(resolve => setTimeout(resolve, ms)))
  const fetchCards = input.fetchProductCards ?? fetchProductCards
  const startedAt = now()
  const deadline = createShopifyRequestDeadline({ timeoutMs: budgetMs })

  try {
    const timeoutMs = remainingBudgetMs(startedAt, budgetMs, now)
    if (timeoutMs <= 0) {
      deadline.abort()
      throw deadline.signal.reason
    }

    try {
      return await fetchCards({
        first: input.first,
        timeoutMs,
        signal: deadline.signal
      })
    } catch (error) {
      const remainingMs = remainingBudgetMs(startedAt, budgetMs, now)
      const jitterMs = getRelatedProductsRetryJitterMs(input.random)

      if (
        !isRetryableShopifyCatalogError(error) ||
        remainingMs <= jitterMs + RELATED_PRODUCTS_MIN_RETRY_BUDGET_MS
      ) {
        throw error
      }

      await sleep(jitterMs)

      const retryTimeoutMs = remainingBudgetMs(startedAt, budgetMs, now)
      if (retryTimeoutMs < RELATED_PRODUCTS_MIN_RETRY_BUDGET_MS) {
        throw error
      }

      return await fetchCards({
        first: input.first,
        timeoutMs: retryTimeoutMs,
        signal: deadline.signal
      })
    }
  } finally {
    deadline.dispose()
  }
}
