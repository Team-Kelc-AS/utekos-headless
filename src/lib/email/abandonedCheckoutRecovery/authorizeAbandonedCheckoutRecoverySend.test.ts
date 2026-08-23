import assert from 'node:assert/strict'
import test from 'node:test'

import { formatPrice } from '@/lib/utils/formatPrice'

import {
  authorizeAbandonedCheckoutRecoverySend,
  type AbandonedCheckoutRecoveryPreSendClaim,
  type ShopifyAbandonedCheckoutPreSendState
} from './authorizeAbandonedCheckoutRecoverySend'

const claim: AbandonedCheckoutRecoveryPreSendClaim = {
  dispatchId: '8d5dce25-4ed0-4ee5-9629-80eb99d1f24d',
  shopifyAbandonedCheckoutId:
    'gid://shopify/AbandonedCheckout/1001',
  shopifyCustomerId: 'gid://shopify/Customer/2001',
  checkoutCreatedAt: '2026-08-09T08:00:00.000Z',
  checkoutUpdatedAt: '2026-08-09T08:20:00.000Z'
}

function createState(
  overrides: Partial<ShopifyAbandonedCheckoutPreSendState['checkout']> = {}
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
      lineItems: [],
      ...overrides
    }
  }
}

test('passes formatted NOK line items through on authorized sends', () => {
  const result = authorizeAbandonedCheckoutRecoverySend({
    claim,
    state: createState({
      lineItems: [
        {
          title: 'Utekos TechDown',
          quantity: 2,
          variantTitle: 'XL',
          priceAmount: '3580.00',
          priceCurrencyCode: 'NOK',
          productHandle: 'utekos-techdown'
        }
      ]
    })
  })

  assert.deepEqual(result, {
    authorized: true,
    to: 'kunde@example.no',
    recoveryUrl:
      'https://checkout.shopify.com/recover/opaque-token',
    lineItems: [
      {
        title: 'Utekos TechDown, XL',
        quantity: 2,
        priceLabel: formatPrice({
          amount: '3580.00',
          currencyCode: 'NOK'
        }),
        imageUrl: null
      }
    ]
  })
})

test('fails closed when a line item is not priced in NOK', () => {
  assert.throws(
    () =>
      authorizeAbandonedCheckoutRecoverySend({
        claim,
        state: createState({
          lineItems: [
            {
              title: 'Utekos TechDown',
              quantity: 1,
              variantTitle: null,
              priceAmount: '1790.00',
              priceCurrencyCode: 'EUR',
              productHandle: 'utekos-techdown'
            }
          ]
        })
      }),
    {
      message: 'abandoned_checkout_recovery_shopify_state_invalid'
    }
  )
})

test('exact checkout evidence overrides only NOT_SUBSCRIBED', () => {
  for (const marketingState of [
    'NOT_SUBSCRIBED',
    'UNSUBSCRIBED',
    'PENDING',
    'INVALID'
  ] as const) {
    const state = createState({
      checkoutEmailMarketingAccepted: true
    })
    state.customer.email = {
      address: 'kunde@example.no',
      marketingState,
      validFormat: marketingState !== 'INVALID'
    }

    const result = authorizeAbandonedCheckoutRecoverySend({
      claim,
      state
    })

    assert.equal(
      result.authorized,
      marketingState === 'NOT_SUBSCRIBED'
    )
  }
})
