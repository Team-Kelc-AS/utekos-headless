import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalPurchaseSchema,
  deterministicPurchaseEventId
} from '@/lib/analytics/purchaseEvent'
import { shopifyCheckoutPurchaseObservationSchema } from '@/lib/analytics/shopifyCheckoutObservationContract'
import type { CanonicalEventStoreInput } from '@/lib/analytics/server/canonicalEventStore'
import { promoteShopifyCheckoutPurchaseObservation } from '@/lib/analytics/server/promoteShopifyCheckoutPurchaseObservation'

const orderLegacyId = '12345'
const eventId = deterministicPurchaseEventId(orderLegacyId)

const purchase = canonicalPurchaseSchema.parse({
  schema_version: 1,
  event_name: 'purchase',
  event_id: eventId,
  event_time: '2026-09-29T12:00:00.000Z',
  source: 'webhook',
  environment: 'test',
  browser_id: { ga_client_id: '123456789.1784201643' },
  consent: {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  },
  custom_data: {
    currency: 'NOK',
    value: 2490,
    transaction_id: `shopify_order_${orderLegacyId}`,
    order_name: '#12345',
    items: [
      {
        item_id: '67890',
        item_name: 'Utekos TechDown™',
        quantity: 2,
        unit_price: 1000
      },
      {
        item_id: '67891',
        item_name: 'StayComfy™',
        quantity: 1,
        unit_price: 490
      }
    ]
  }
})

function observation(
  privacy: {
    analyticsProcessingAllowed: boolean
    marketingAllowed: boolean
    preferencesProcessingAllowed: boolean
    saleOfDataAllowed: boolean
  } = {
    analyticsProcessingAllowed: true,
    marketingAllowed: true,
    preferencesProcessingAllowed: false,
    saleOfDataAllowed: true
  }
) {
  return shopifyCheckoutPurchaseObservationSchema.parse({
    contract: 'utekos.shopify.checkout_observation',
    schemaVersion: 4,
    source: 'shopify_app_web_pixel',
    verificationStatus: 'observed',
    eventId: 'shopify-checkout-completed-1',
    eventName: 'checkout_completed',
    eventSequence: 12,
    occurredAt: '2026-09-29T12:00:02.000Z',
    checkoutToken: 'checkout-token',
    orderLegacyId,
    commerce: {
      currencyCode: 'NOK',
      value: 2490,
      itemQuantity: 3,
      tax: 498,
      shipping: 0,
      items: [
        {
          itemId: '67890',
          itemName: 'Utekos TechDown™',
          quantity: 2,
          price: 1000
        },
        {
          itemId: '67891',
          itemName: 'StayComfy™',
          quantity: 1,
          price: 490
        }
      ]
    },
    privacy
  })
}

test('corroborates an App Web Pixel Purchase and releases only Google and Meta', async () => {
  let accepted: CanonicalEventStoreInput | undefined

  const result = await promoteShopifyCheckoutPurchaseObservation(
    observation(),
    {
      now: () => new Date('2026-09-29T12:00:03.000Z'),
      store: {
        find: async () => purchase,
        accept: async input => {
          accepted = input
          return {
            createdDispatchAttempts: [],
            status: 'duplicate'
          }
        }
      }
    }
  )

  assert.deepEqual(result, { eventId, status: 'duplicate' })
  assert.deepEqual(
    accepted?.dispatches.map(dispatch => dispatch.provider),
    ['google', 'meta']
  )
  assert.deepEqual(accepted?.releaseProvidersOnDuplicate, [
    'google',
    'meta'
  ])
  assert.deepEqual(accepted?.sourceEvidence, {
    canonical_event_id: eventId,
    source_system: 'shopify',
    source_method: 'web_pixel',
    source_object_type: 'order',
    source_object_id: orderLegacyId,
    source_topic: 'checkout_completed',
    source_delivery_id: null,
    source_event_id: 'shopify-checkout-completed-1',
    source_api_version: '2026-04',
    source_triggered_at: '2026-09-29T12:00:02.000Z',
    source_observed_at: '2026-09-29T12:00:03.000Z'
  })
})

test('applies the App Web Pixel privacy snapshot per provider', async () => {
  let accepted: CanonicalEventStoreInput | undefined

  await promoteShopifyCheckoutPurchaseObservation(
    observation({
      analyticsProcessingAllowed: true,
      marketingAllowed: false,
      preferencesProcessingAllowed: false,
      saleOfDataAllowed: false
    }),
    {
      store: {
        find: async () => purchase,
        accept: async input => {
          accepted = input
          return {
            createdDispatchAttempts: [],
            status: 'duplicate'
          }
        }
      }
    }
  )

  assert.deepEqual(
    accepted?.dispatches.map(dispatch => dispatch.provider),
    ['google']
  )
  assert.deepEqual(accepted?.releaseProvidersOnDuplicate, [
    'google'
  ])
})

test('does not release providers when observed commerce conflicts with paid-order truth', async () => {
  let acceptCalls = 0
  const conflicting = observation()

  const result = await promoteShopifyCheckoutPurchaseObservation(
    {
      ...conflicting,
      commerce: { ...conflicting.commerce, value: 1 }
    },
    {
      store: {
        find: async () => purchase,
        accept: async () => {
          acceptCalls += 1
          return {
            createdDispatchAttempts: [],
            status: 'duplicate'
          }
        }
      }
    }
  )

  assert.deepEqual(result, { status: 'not_applicable' })
  assert.equal(acceptCalls, 0)
})

test('returns a retryable failure until paid-order truth exists', async () => {
  await assert.rejects(
    promoteShopifyCheckoutPurchaseObservation(observation(), {
      store: {
        find: async () => null,
        accept: async () => {
          throw new Error('unexpected accept')
        }
      }
    }),
    /canonical_purchase_not_ready/
  )
})
