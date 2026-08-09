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
    comfyrobeProductId: 'gid://shopify/Product/5001',
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
                { product: { id: 'gid://shopify/Product/5001' } }
              ],
              pageInfo: { hasNextPage: false }
            }
          }
        },
        codeDiscountNodeByCode: {
          codeDiscount: {
            __typename: 'DiscountCodeApp',
            status: 'ACTIVE',
            discountClasses: ['PRODUCT', 'SHIPPING'],
            appliesOncePerCustomer: true,
            appliesOnOneTimePurchase: true,
            appliesOnSubscription: false,
            combinesWith: {
              orderDiscounts: false,
              productDiscounts: false,
              shippingDiscounts: false
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
          'gid://shopify/AbandonedCheckout/1001',
        discountCode: 'STAYCOMFY'
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
      createdAt: '2026-08-09T08:00:00Z',
      updatedAt: '2026-08-09T08:25:00Z',
      completedAt: null,
      recoveryUrl:
        'https://checkout.shopify.com/recover/opaque-token',
      containsComfyrobe: true
    }
  })
})

test('fails closed when Shopify has no abandonment for the checkout', async () => {
  await assert.rejects(
    fetchShopifyAbandonedCheckoutPreSendState({
      abandonedCheckoutId:
        'gid://shopify/AbandonedCheckout/1001',
      comfyrobeProductId: 'gid://shopify/Product/5001',
      executeAdminGraphql: async () => ({
        abandonmentByAbandonedCheckoutId: null,
        codeDiscountNodeByCode: null
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
      comfyrobeProductId: 'gid://shopify/Product/5001',
      executeAdminGraphql: async () => ({
        abandonmentByAbandonedCheckoutId: {
          id: 'gid://shopify/Abandonment/3001'
        },
        codeDiscountNodeByCode: null
      })
    }),
    {
      message:
        'abandoned_checkout_recovery_shopify_state_invalid'
    }
  )
})
