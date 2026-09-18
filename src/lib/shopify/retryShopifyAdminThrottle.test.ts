import assert from 'node:assert/strict'
import test from 'node:test'

import {
  hasShopifyAdminGraphqlErrorCode,
  retryShopifyAdminThrottle,
  ShopifyAdminThrottleError,
  SHOPIFY_ADMIN_THROTTLE_RETRY_DELAY_MS
} from './retryShopifyAdminThrottle'

test('recognizes a Shopify GraphQL THROTTLED error code', () => {
  assert.equal(
    hasShopifyAdminGraphqlErrorCode(
      [
        {
          message: 'Throttled',
          extensions: { code: 'THROTTLED' }
        }
      ],
      'THROTTLED'
    ),
    true
  )
  assert.equal(
    hasShopifyAdminGraphqlErrorCode(
      [{ extensions: { code: 'ACCESS_DENIED' } }],
      'THROTTLED'
    ),
    false
  )
})

test('retries a throttled Shopify Admin request once after one second', async () => {
  let attempts = 0
  const delays: number[] = []

  const result = await retryShopifyAdminThrottle(
    async () => {
      attempts += 1

      if (attempts === 1) {
        throw new ShopifyAdminThrottleError('Throttled')
      }

      return 'ok'
    },
    {
      sleep: async milliseconds => {
        delays.push(milliseconds)
      }
    }
  )

  assert.equal(result, 'ok')
  assert.equal(attempts, 2)
  assert.deepEqual(delays, [
    SHOPIFY_ADMIN_THROTTLE_RETRY_DELAY_MS
  ])
})

test('does not retry a non-throttling error', async () => {
  let attempts = 0

  await assert.rejects(
    retryShopifyAdminThrottle(async () => {
      attempts += 1
      throw new Error('Invalid query')
    }),
    /Invalid query/
  )

  assert.equal(attempts, 1)
})

test('propagates a second throttling error without another delay', async () => {
  let attempts = 0
  const delays: number[] = []

  await assert.rejects(
    retryShopifyAdminThrottle(
      async () => {
        attempts += 1
        throw new ShopifyAdminThrottleError('Still throttled')
      },
      {
        sleep: async milliseconds => {
          delays.push(milliseconds)
        }
      }
    ),
    ShopifyAdminThrottleError
  )

  assert.equal(attempts, 2)
  assert.deepEqual(delays, [
    SHOPIFY_ADMIN_THROTTLE_RETRY_DELAY_MS
  ])
})
