import assert from 'node:assert/strict'
import test from 'node:test'

import {
  fetchShopifyAbandonedCheckoutPreSendState,
  SHOPIFY_ABANDONED_CHECKOUT_PRE_SEND_QUERY
} from './fetchShopifyAbandonedCheckoutPreSendState'

test('fetches and normalizes the authoritative Shopify abandonment state', async () => {
  const requests: Array<{
    query: string
    variables: Record<string, unknown>
  }> = []

  const state = await fetchShopifyAbandonedCheckoutPreSendState({
    abandonedCheckoutId: 'gid://shopify/AbandonedCheckout/1001',
    executeAdminGraphql: async request => {
      requests.push(request)

      return {
        abandonmentByAbandonedCheckoutId: {
          id: 'gid://shopify/Abandonment/3001',
          createdAt: '2026-08-09T08:30:00Z',
          customerHasNoDraftOrderSinceAbandonment: true,
          customerHasNoOrderSinceAbandonment: true,
          emailSentAt: null,
          emailState: 'NOT_SENT',
          inventoryAvailable: true,
          isMostSignificantAbandonment: true,
          customer: {
            id: 'gid://shopify/Customer/2001',
            defaultEmailAddress: {
              emailAddress: 'kunde@example.no',
              marketingState: 'SUBSCRIBED',
              validFormat: true
            }
          },
          abandonedCheckoutPayload: {
            id: 'gid://shopify/AbandonedCheckout/1001',
            createdAt: '2026-08-09T08:00:00Z',
            updatedAt: '2026-08-09T08:25:00Z',
            completedAt: null,
            abandonedCheckoutUrl:
              'https://checkout.shopify.com/recover/opaque-token',
            customer: { id: 'gid://shopify/Customer/2001' },
            lineItems: {
              nodes: [
                {
                  title: 'Utekos TechDown',
                  quantity: 1,
                  variantTitle: 'Default Title',
                  discountedTotalPriceSet: {
                    shopMoney: {
                      amount: '1790.00',
                      currencyCode: 'NOK'
                    }
                  },
                  product: { handle: 'utekos-techdown' }
                }
              ],
              pageInfo: { hasNextPage: false }
            }
          }
        }
      }
    }
  })

  assert.deepEqual(requests, [
    {
      query: SHOPIFY_ABANDONED_CHECKOUT_PRE_SEND_QUERY,
      variables: {
        abandonedCheckoutId:
          'gid://shopify/AbandonedCheckout/1001'
      }
    }
  ])
  assert.deepEqual(state, {
    abandonmentId: 'gid://shopify/Abandonment/3001',
    createdAt: '2026-08-09T08:30:00Z',
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
      createdAt: '2026-08-09T08:00:00Z',
      updatedAt: '2026-08-09T08:25:00Z',
      completedAt: null,
      recoveryUrl:
        'https://checkout.shopify.com/recover/opaque-token',
      lineItems: [
        {
          title: 'Utekos TechDown',
          quantity: 1,
          variantTitle: null,
          priceAmount: '1790.00',
          priceCurrencyCode: 'NOK',
          productHandle: 'utekos-techdown'
        }
      ]
    }
  })
})

test('fails closed when Shopify has no abandonment for the checkout', async () => {
  await assert.rejects(
    fetchShopifyAbandonedCheckoutPreSendState({
      abandonedCheckoutId:
        'gid://shopify/AbandonedCheckout/1001',
      executeAdminGraphql: async () => ({
        abandonmentByAbandonedCheckoutId: null
      })
    }),
    {
      message:
        'abandoned_checkout_recovery_shopify_state_missing'
    }
  )
})

test('fails closed on a malformed Shopify response', async () => {
  await assert.rejects(
    fetchShopifyAbandonedCheckoutPreSendState({
      abandonedCheckoutId:
        'gid://shopify/AbandonedCheckout/1001',
      executeAdminGraphql: async () => ({
        abandonmentByAbandonedCheckoutId: {
          id: 'gid://shopify/Abandonment/3001'
        }
      })
    }),
    {
      message:
        'abandoned_checkout_recovery_shopify_state_invalid'
    }
  )
})

test('fails closed when Shopify truncates abandoned checkout line items', async () => {
  await assert.rejects(
    fetchShopifyAbandonedCheckoutPreSendState({
      abandonedCheckoutId:
        'gid://shopify/AbandonedCheckout/1001',
      executeAdminGraphql: async () => ({
        abandonmentByAbandonedCheckoutId: {
          id: 'gid://shopify/Abandonment/3001',
          createdAt: '2026-08-09T08:30:00Z',
          customerHasNoDraftOrderSinceAbandonment: true,
          customerHasNoOrderSinceAbandonment: true,
          emailSentAt: null,
          emailState: 'NOT_SENT',
          inventoryAvailable: true,
          isMostSignificantAbandonment: true,
          customer: {
            id: 'gid://shopify/Customer/2001',
            defaultEmailAddress: {
              emailAddress: 'kunde@example.no',
              marketingState: 'SUBSCRIBED',
              validFormat: true
            }
          },
          abandonedCheckoutPayload: {
            id: 'gid://shopify/AbandonedCheckout/1001',
            createdAt: '2026-08-09T08:00:00Z',
            updatedAt: '2026-08-09T08:25:00Z',
            completedAt: null,
            abandonedCheckoutUrl:
              'https://checkout.shopify.com/recover/opaque-token',
            customer: { id: 'gid://shopify/Customer/2001' },
            lineItems: {
              nodes: [],
              pageInfo: { hasNextPage: true }
            }
          }
        }
      })
    }),
    {
      message:
        'abandoned_checkout_recovery_shopify_state_invalid'
    }
  )
})
