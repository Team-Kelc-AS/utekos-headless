import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalBeginCheckoutSchema } from '../beginCheckoutEvent'
import type { ShopifyCanonicalCheckoutProgressObservation } from '../shopifyCheckoutObservationContract'
import type {
  CanonicalEventStore,
  CanonicalEventStoreInput
} from './canonicalEventStore'
import { promoteShopifyAddShippingInfoObservation } from './promoteShopifyAddShippingInfoObservation'

const beginCheckoutEventId =
  '71c2ef59-6e6f-4f56-a63a-567ca398f9de'
const observation: ShopifyCanonicalCheckoutProgressObservation =
  {
    contract: 'utekos.shopify.checkout_observation',
    schemaVersion: 2,
    source: 'shopify_app_web_pixel',
    verificationStatus: 'observed',
    eventId: 'shopify-shipping-event-1',
    eventName: 'checkout_shipping_info_submitted',
    eventSequence: 6,
    occurredAt: '2026-08-17T10:05:00.000Z',
    checkoutToken: 'checkout-token',
    correlation: { beginCheckoutEventId },
    commerce: {
      currencyCode: 'NOK',
      value: 2490,
      itemQuantity: 1
    },
    privacy: {
      analyticsProcessingAllowed: true,
      marketingAllowed: true,
      preferencesProcessingAllowed: false,
      saleOfDataAllowed: false
    }
  }
const beginCheckout = canonicalBeginCheckoutSchema.parse({
  schema_version: 1,
  event_name: 'begin_checkout',
  event_id: beginCheckoutEventId,
  event_time: '2026-08-17T10:00:00.000Z',
  source: 'web',
  environment: 'production',
  page_url: 'https://utekos.no/handlekurv',
  page_title: 'Handlekurv',
  journey_id: '11111111-1111-4111-8111-111111111111',
  page_view_id: '22222222-2222-4222-8222-222222222222',
  browser_id: {
    ga_client_id: '1234567890.987654321',
    fbp: 'fb.1.1234567890.1234567890'
  },
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
    gross_value: 2490,
    tax_value: 498,
    cart_id: 'cart-1',
    checkout_id: 'checkout-1',
    creation_revision: '1',
    items: [
      {
        item_id: 'variant-1',
        item_name: 'Utekos Dun',
        unit_price: 2490,
        gross_unit_price: 2490,
        quantity: 1,
        tax_amount: 498,
        tax_rate: 0.25,
        taxable: true,
        price_includes_tax: true,
        product_id: 'gid://shopify/Product/1',
        variant_id: 'gid://shopify/ProductVariant/1',
        product_handle: 'utekos-dun',
        available_for_sale: true,
        currently_not_in_stock: false,
        quantity_available: 3,
        collection_ids: [],
        collection_titles: [],
        selected_options: []
      }
    ]
  }
})

test('promotes correlated shipping submission to canonical Meta outbox', async () => {
  const accepted: CanonicalEventStoreInput[] = []
  const store: Required<CanonicalEventStore> = {
    async find() {
      return beginCheckout
    },
    async accept(input) {
      accepted.push(input)
      return { createdDispatchAttempts: [], status: 'inserted' }
    }
  }
  const result = await promoteShopifyAddShippingInfoObservation(
    observation,
    {
      config: {
        enabled: true,
        cutoverAt: '2026-08-17T10:04:00.000Z'
      },
      environment: 'production',
      store
    }
  )
  assert.equal(result.status, 'inserted')
  assert.equal(
    accepted[0]?.event.event_name,
    'add_shipping_info'
  )
  assert.deepEqual(accepted[0]?.dispatches, [
    {
      dispatch_mode: 'server_retry',
      event_id: accepted[0]!.event.event_id,
      provider: 'meta'
    }
  ])
  assert.equal(accepted[0]?.event.consent.marketing, 'granted')
  assert.equal(
    accepted[0]?.event.journey_id,
    beginCheckout.journey_id
  )
  assert.equal(
    'page_view_id' in accepted[0]!.event &&
      accepted[0]!.event.page_view_id,
    beginCheckout.page_view_id
  )
})

test('wrong source event and denied analytics never persist or log completed shipping', async t => {
  const logs: unknown[] = []
  for (const method of ['log', 'warn', 'error'] as const) {
    t.mock.method(console, method, (...values: unknown[]) => {
      logs.push(values)
    })
  }
  let lookups = 0
  let accepted = 0
  const store: Required<CanonicalEventStore> = {
    async find() {
      lookups += 1
      return beginCheckout
    },
    async accept() {
      accepted += 1
      return { createdDispatchAttempts: [], status: 'inserted' }
    }
  }
  for (const input of [
    {
      ...observation,
      eventName: 'payment_info_submitted' as const
    },
    {
      ...observation,
      privacy: {
        ...observation.privacy,
        analyticsProcessingAllowed: false,
        marketingAllowed: true
      }
    }
  ]) {
    const result =
      await promoteShopifyAddShippingInfoObservation(input, {
        config: {
          enabled: true,
          cutoverAt: '2026-08-17T10:04:00.000Z'
        },
        environment: 'production',
        store
      })
    assert.deepEqual(result, { status: 'not_applicable' })
  }
  assert.equal(lookups, 0)
  assert.equal(accepted, 0)
  assert.deepEqual(logs, [])
})

test('failed shipping persistence never logs a completed commerce event', async t => {
  const logs: unknown[] = []
  for (const method of ['log', 'warn', 'error'] as const) {
    t.mock.method(console, method, (...values: unknown[]) => {
      logs.push(values)
    })
  }
  const failure = new Error(
    'synthetic shipping persistence failure'
  )
  let accepted = 0
  const store: Required<CanonicalEventStore> = {
    async find() {
      return beginCheckout
    },
    async accept() {
      accepted += 1
      throw failure
    }
  }
  await assert.rejects(
    promoteShopifyAddShippingInfoObservation(observation, {
      config: {
        enabled: true,
        cutoverAt: '2026-08-17T10:04:00.000Z'
      },
      environment: 'production',
      store
    }),
    error => error === failure
  )
  assert.equal(accepted, 1)
  assert.deepEqual(logs, [])
})
