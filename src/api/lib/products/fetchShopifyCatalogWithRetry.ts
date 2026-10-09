import 'server-only'

import { createShopifyRequestDeadline } from '@/api/shopify/request/createShopifyRequestDeadline'
import { DEFAULT_SHOPIFY_STOREFRONT_TIMEOUT_MS } from '@/api/shopify/request/shopifyRequestObservability'
import { isRetryableShopifyCatalogError } from './isRetryableShopifyCatalogError'

export const SHOPIFY_CATALOG_RETRY_DELAY_MS = 1_000
export const SHOPIFY_CATALOG_MIN_RETRY_BUDGET_MS = 500

export type ShopifyCatalogAttempt<T> = (input: {
  timeoutMs: number
  signal: AbortSignal
}) => Promise<T>

function remainingBudgetMs(
  startedAt: number,
  budgetMs: number,
  now: () => number
) {
  return Math.max(0, budgetMs - (now() - startedAt))
}

/**
 * Retry one idempotent catalog query within a single request budget.
 * Shopify documents most 5xx responses as transient and recommends retrying
 * them. The fixed one-second backoff also matches Shopify's recommended
 * minimum wait for rate-limit recovery.
 */
export async function fetchShopifyCatalogWithRetry<T>(input: {
  attempt: ShopifyCatalogAttempt<T>
  budgetMs?: number
  retryDelayMs?: number
  minRetryBudgetMs?: number
  now?: () => number
  sleep?: (ms: number) => Promise<void>
}): Promise<T> {
  const budgetMs =
    input.budgetMs ?? DEFAULT_SHOPIFY_STOREFRONT_TIMEOUT_MS
  const retryDelayMs =
    input.retryDelayMs ?? SHOPIFY_CATALOG_RETRY_DELAY_MS
  const minRetryBudgetMs =
    input.minRetryBudgetMs ?? SHOPIFY_CATALOG_MIN_RETRY_BUDGET_MS
  const now = input.now ?? (() => performance.now())
  const sleep = input.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)))
  const startedAt = now()
  const deadline = createShopifyRequestDeadline({ timeoutMs: budgetMs })

  try {
    const timeoutMs = remainingBudgetMs(startedAt, budgetMs, now)
    if (timeoutMs <= 0) {
      deadline.abort()
      throw deadline.signal.reason
    }

    try {
      return await input.attempt({
        timeoutMs,
        signal: deadline.signal
      })
    } catch (error) {
      const remainingMs = remainingBudgetMs(startedAt, budgetMs, now)

      if (
        !isRetryableShopifyCatalogError(error) ||
        remainingMs <= retryDelayMs + minRetryBudgetMs
      ) {
        throw error
      }

      await sleep(retryDelayMs)

      const retryTimeoutMs = remainingBudgetMs(
        startedAt,
        budgetMs,
        now
      )
      if (retryTimeoutMs < minRetryBudgetMs) {
        throw error
      }

      return await input.attempt({
        timeoutMs: retryTimeoutMs,
        signal: deadline.signal
      })
    }
  } finally {
    deadline.dispose()
  }
}
