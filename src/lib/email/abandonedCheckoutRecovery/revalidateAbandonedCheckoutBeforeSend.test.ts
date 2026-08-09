import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  AbandonedCheckoutRecoveryPreSendClaim,
  ShopifyAbandonedCheckoutPreSendState
} from './authorizeAbandonedCheckoutRecoverySend'
import { revalidateAbandonedCheckoutBeforeSend } from './revalidateAbandonedCheckoutBeforeSend'

const claim: AbandonedCheckoutRecoveryPreSendClaim = {
  dispatchId: '8d5dce25-4ed0-4ee5-9629-80eb99d1f24d',
  shopifyAbandonedCheckoutId:
    'gid://shopify/AbandonedCheckout/1001',
  shopifyCustomerId: 'gid://shopify/Customer/2001',
  checkoutCreatedAt: '2026-08-09T08:00:00.000Z',
  checkoutUpdatedAt: '2026-08-09T08:20:00.000Z'
}

const state = {
  abandonmentId: 'gid://shopify/Abandonment/3001',
  createdAt: '2026-08-09T08:30:00.000Z',
  customerHasNoDraftOrderSinceAbandonment: true,
  customerHasNoOrderSinceAbandonment: true,
  emailSentAt: null,
  emailState: 'NOT_SENT',
  inventoryAvailable: true,
  isMostSignificantAbandonment: true,
  staycomfyDiscountActive: true,
  customer: {
    id: 'gid://shopify/Customer/2001',
    email: {
      address: 'kunde@example.no',
      marketingState: 'SUBSCRIBED',
      validFormat: true
    }
  },
  checkout: {
    id: 'gid://shopify/AbandonedCheckout/1001',
    customerId: 'gid://shopify/Customer/2001',
    createdAt: '2026-08-09T08:00:00.000Z',
    updatedAt: '2026-08-09T08:25:00.000Z',
    completedAt: null,
    recoveryUrl:
      'https://checkout.shopify.com/recover/opaque-token',
    containsComfyrobe: true
  }
} satisfies ShopifyAbandonedCheckoutPreSendState

test('fetches by claimed checkout and returns only the authorization result', async () => {
  const fetchedIds: string[] = []

  const result = await revalidateAbandonedCheckoutBeforeSend(
    claim,
    {
      fetchState: async abandonedCheckoutId => {
        fetchedIds.push(abandonedCheckoutId)
        return state
      }
    }
  )

  assert.deepEqual(fetchedIds, [
    claim.shopifyAbandonedCheckoutId
  ])
  assert.deepEqual(result, {
    authorized: true,
    to: 'kunde@example.no',
    recoveryUrl:
      'https://checkout.shopify.com/recover/opaque-token',
    offerType: 'staycomfy'
  })
})

test('redacts raw Shopify failures at the revalidation boundary', async () => {
  await assert.rejects(
    revalidateAbandonedCheckoutBeforeSend(claim, {
      fetchState: async () => {
        throw new Error(
          'Shopify secret response containing kunde@example.no'
        )
      }
    }),
    {
      message: 'abandoned_checkout_recovery_revalidation_failed'
    }
  )
})
