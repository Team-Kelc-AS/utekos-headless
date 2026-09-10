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
                  image: {
                    url:
                      'https://cdn.shopify.com/s/files/1/line-item.jpg?v=1',
                    altText: 'TechDown fra Shopify'
                  },
                  variant: {
                    id: 'gid://shopify/ProductVariant/4001',
                    barcode: ' 07090062980009 ',
                    recoveryEmailImage: {
                      reference: {
                        image: {
                          url:
                            'https://cdn.shopify.com/s/files/1/recovery.jpg?v=2',
                          altText: 'Kurert TechDown-bilde'
                        }
                      }
                    }
                  }
                },
                {
                  title: 'Comfyrobe',
                  quantity: 2,
                  variantTitle: 'XL',
                  discountedTotalPriceSet: {
                    shopMoney: {
                      amount: '3380.00',
                      currencyCode: 'NOK'
                    }
                  },
                  image: {
                    url:
                      'https://cdn.shopify.com/s/files/1/comfyrobe.jpg',
                    altText: null
                  },
                  variant: {
                    id: 'gid://shopify/ProductVariant/4002',
                    barcode: null,
                    recoveryEmailImage: null
                  }
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
  assert.match(
    SHOPIFY_ABANDONED_CHECKOUT_PRE_SEND_QUERY,
    /recoveryEmailImage: metafield\([\s\S]*namespace: "utekos"[\s\S]*key: "recovery_email_image"/u
  )
  assert.match(
    SHOPIFY_ABANDONED_CHECKOUT_PRE_SEND_QUERY,
    /image \{[\s\S]*url[\s\S]*altText/u
  )
  assert.match(
    SHOPIFY_ABANDONED_CHECKOUT_PRE_SEND_QUERY,
    /variant \{[\s\S]*id[\s\S]*barcode/u
  )
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
          variantId: 'gid://shopify/ProductVariant/4001',
          barcode: '07090062980009',
          recoveryEmailImage: {
            url:
              'https://cdn.shopify.com/s/files/1/recovery.jpg?v=2',
            altText: 'Kurert TechDown-bilde'
          },
          shopifyLineItemImage: {
            url:
              'https://cdn.shopify.com/s/files/1/line-item.jpg?v=1',
            altText: 'TechDown fra Shopify'
          }
        },
        {
          title: 'Comfyrobe',
          quantity: 2,
          variantTitle: 'XL',
          priceAmount: '3380.00',
          priceCurrencyCode: 'NOK',
          variantId: 'gid://shopify/ProductVariant/4002',
          barcode: null,
          recoveryEmailImage: null,
          shopifyLineItemImage: {
            url:
              'https://cdn.shopify.com/s/files/1/comfyrobe.jpg',
            altText: null
          }
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
