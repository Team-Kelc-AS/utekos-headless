import assert from 'node:assert/strict'
import test from 'node:test'

import {
  authorizeAbandonedCheckoutRecoverySend,
  type AbandonedCheckoutRecoveryPreSendClaim,
  type ShopifyAbandonedCheckoutPreSendState
} from './authorizeAbandonedCheckoutRecoverySend'

const claim: AbandonedCheckoutRecoveryPreSendClaim = {
  dispatchId: '8d5dce25-4ed0-4ee5-9629-80eb99d1f24d',
  shopifyAbandonedCheckoutId: 'gid://shopify/AbandonedCheckout/1001',
  shopifyCustomerId: 'gid://shopify/Customer/2001',
  checkoutCreatedAt: '2026-08-09T08:00:00.000Z',
  checkoutUpdatedAt: '2026-08-09T08:20:00.000Z'
}

function state(
  overrides: Partial<ShopifyAbandonedCheckoutPreSendState> = {}
): ShopifyAbandonedCheckoutPreSendState {
  return {
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
      id: claim.shopifyCustomerId,
      email: {
        address: 'kunde@example.no',
        marketingState: 'SUBSCRIBED',
        validFormat: true
      }
    },
    checkout: {
      id: claim.shopifyAbandonedCheckoutId,
      customerId: claim.shopifyCustomerId,
      createdAt: claim.checkoutCreatedAt,
      updatedAt: '2026-08-09T08:25:00.000Z',
      completedAt: null,
      recoveryUrl: 'https://checkout.shopify.com/recover/opaque',
      containsComfyrobe: true
    },
    ...overrides
  }
}

test('authorizes a Comfyrobe offer only with active v2 discount state', () => {
  assert.deepEqual(
    authorizeAbandonedCheckoutRecoverySend({ claim, state: state() }),
    {
      authorized: true,
      to: 'kunde@example.no',
      recoveryUrl: 'https://checkout.shopify.com/recover/opaque',
      offerType: 'staycomfy'
    }
  )

  assert.deepEqual(
    authorizeAbandonedCheckoutRecoverySend({
      claim,
      state: state({ staycomfyDiscountActive: false })
    }),
    {
      authorized: true,
      to: 'kunde@example.no',
      recoveryUrl: 'https://checkout.shopify.com/recover/opaque',
      offerType: 'generic'
    }
  )
})

test('suppresses completed, unsubscribed and Shopify-scheduled checkouts', () => {
  const cases: Array<{
    value: ShopifyAbandonedCheckoutPreSendState
    reason: string
  }> = [
    {
      value: state({
        checkout: {
          ...state().checkout,
          completedAt: '2026-08-09T08:45:00.000Z'
        }
      }),
      reason: 'recovered'
    },
    {
      value: state({
        customer: {
          ...state().customer,
          email: {
            address: 'kunde@example.no',
            marketingState: 'UNSUBSCRIBED',
            validFormat: true
          }
        }
      }),
      reason: 'not_subscribed'
    },
    {
      value: state({ emailState: 'SCHEDULED' }),
      reason: 'shopify_email_scheduled'
    }
  ]

  for (const item of cases) {
    const result = authorizeAbandonedCheckoutRecoverySend({
      claim,
      state: item.value
    })
    assert.equal(result.authorized, false)
    assert.equal(
      result.authorized ? null : result.suppressionReason,
      item.reason
    )
  }
})
