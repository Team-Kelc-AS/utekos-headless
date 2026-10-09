import assert from 'node:assert/strict'
import test from 'node:test'

import { ShopifyStorefrontHttpError } from '@/api/shopify/request/ShopifyStorefrontHttpError'
import { fetchShopifyCatalogWithRetry } from '@/api/lib/products/fetchShopifyCatalogWithRetry'

test('retries one transient Shopify 503 within the total budget', async () => {
  let attempts = 0
  let elapsedMs = 0
  const timeouts: number[] = []

  const result = await fetchShopifyCatalogWithRetry({
    budgetMs: 8_000,
    retryDelayMs: 1_000,
    minRetryBudgetMs: 500,
    now: () => elapsedMs,
    sleep: async ms => {
      elapsedMs += ms
    },
    attempt: async ({ timeoutMs }) => {
      attempts++
      timeouts.push(timeoutMs)
      if (attempts === 1) {
        elapsedMs += 217
        throw new ShopifyStorefrontHttpError(503, 'request-1')
      }
      return 'recovered'
    }
  })

  assert.equal(result, 'recovered')
  assert.equal(attempts, 2)
  assert.deepEqual(timeouts, [8_000, 6_783])
})

test('does not retry a non-transient Shopify 400', async () => {
  let attempts = 0

  await assert.rejects(
    fetchShopifyCatalogWithRetry({
      sleep: async () => undefined,
      attempt: async () => {
        attempts++
        throw new ShopifyStorefrontHttpError(400, 'request-2')
      }
    }),
    error =>
      error instanceof ShopifyStorefrontHttpError &&
      error.status === 400
  )

  assert.equal(attempts, 1)
})

test('does not start a retry when the remaining budget is too small', async () => {
  let attempts = 0
  let elapsedMs = 0

  await assert.rejects(
    fetchShopifyCatalogWithRetry({
      budgetMs: 1_400,
      retryDelayMs: 1_000,
      minRetryBudgetMs: 500,
      now: () => elapsedMs,
      sleep: async ms => {
        elapsedMs += ms
      },
      attempt: async () => {
        attempts++
        elapsedMs += 100
        throw new ShopifyStorefrontHttpError(503, 'request-3')
      }
    }),
    ShopifyStorefrontHttpError
  )

  assert.equal(attempts, 1)
  assert.equal(elapsedMs, 100)
})
