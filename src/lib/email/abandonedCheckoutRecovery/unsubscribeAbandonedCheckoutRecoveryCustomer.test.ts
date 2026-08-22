import assert from 'node:assert/strict'
import test from 'node:test'

import {
  unsubscribeAbandonedCheckoutRecoveryCustomer
} from './unsubscribeAbandonedCheckoutRecoveryCustomer'

const customerId = 'gid://shopify/Customer/123456'
const now = new Date('2026-08-22T08:00:00.000Z')

test('updates Shopify before suppressing remaining dispatches', async () => {
  const calls: string[] = []
  const result = await unsubscribeAbandonedCheckoutRecoveryCustomer(
    { shopifyCustomerId: customerId, now },
    {
      updateShopify: async (receivedId, receivedNow) => {
        calls.push('shopify')
        assert.equal(receivedId, customerId)
        assert.equal(receivedNow, now)
        return {
          customerEmailMarketingConsentUpdate: {
            customer: {
              id: customerId,
              defaultEmailAddress: {
                marketingState: 'UNSUBSCRIBED',
                marketingUpdatedAt: now.toISOString()
              }
            },
            userErrors: []
          }
        }
      },
      suppressPending: async () => {
        calls.push('database')
        return 2
      }
    }
  )

  assert.deepEqual(calls, ['shopify', 'database'])
  assert.deepEqual(result, { suppressedDispatches: 2 })
})

test('does not suppress locally when Shopify rejects the unsubscribe', async () => {
  let databaseCalls = 0

  await assert.rejects(
    unsubscribeAbandonedCheckoutRecoveryCustomer(
      { shopifyCustomerId: customerId, now },
      {
        updateShopify: async () => ({
          customerEmailMarketingConsentUpdate: {
            customer: null,
            userErrors: [{ message: 'scope missing' }]
          }
        }),
        suppressPending: async () => {
          databaseCalls += 1
          return 1
        }
      }
    ),
    /unsubscribe_shopify_failed/u
  )

  assert.equal(databaseCalls, 0)
})
