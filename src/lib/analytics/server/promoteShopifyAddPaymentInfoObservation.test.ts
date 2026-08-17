import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalBeginCheckoutSchema } from '../beginCheckoutEvent'
import type { ShopifyCanonicalPaymentObservation } from '../shopifyCheckoutObservationContract'
import { canonicalEventSourceEvidenceSchema } from './canonicalEventSourceEvidence'
import type {
  CanonicalEventStore,
  CanonicalEventStoreInput
} from './canonicalEventStore'
import { promoteShopifyAddPaymentInfoObservation } from './promoteShopifyAddPaymentInfoObservation'

const beginCheckoutEventId =
  '71c2ef59-6e6f-4f56-a63a-567ca398f9de'

const observation: ShopifyCanonicalPaymentObservation = {
  contract: 'utekos.shopify.checkout_observation',
  schemaVersion: 2,
  source: 'shopify_app_web_pixel',
  verificationStatus: 'observed',
  eventId: 'shopify-payment-event-1',
  eventName: 'payment_info_submitted',
  eventSequence: 7,
  occurredAt: '2026-08-04T10:05:00.000Z',
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
  event_time: '2026-08-04T10:00:00.000Z',
  source: 'web',
  environment: 'production',
  page_url: 'https://utekos.no/handlekurv',
  page_title: 'Handlekurv',
  browser_id: {
    ga_client_id: '1234567890.987654321',
    fbp: 'must-not-be-copied'
  },
  click_id: { fbclid: 'must-not-be-copied' },
  external_id: 'must-not-be-copied',
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
        product_id: 'product-1',
        variant_id: 'variant-1',
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

function store(source = beginCheckout) {
  const accepted: CanonicalEventStoreInput[] = []
  const implementation: Required<CanonicalEventStore> = {
    async find() {
      return source
    },
    async accept(input) {
      accepted.push(input)
      return {
        createdDispatchAttempts: [],
        status: 'inserted'
      }
    }
  }

  return { accepted, implementation }
}

test('promotes to Google and Meta when analytics and marketing consent are granted', async () => {
  const target = store()
  const result = await promoteShopifyAddPaymentInfoObservation(
    observation,
    {
      config: {
        enabled: true,
        cutoverAt: '2026-08-04T10:04:00.000Z'
      },
      environment: 'production',
      now: () => new Date('2026-08-04T10:05:01.000Z'),
      store: target.implementation
    }
  )

  assert.equal(result.status, 'inserted')
  assert.equal(target.accepted.length, 1)
  const accepted = target.accepted[0]!
  assert.equal(accepted.event.event_name, 'add_payment_info')
  assert.deepEqual(accepted.dispatches, [
    {
      dispatch_mode: 'server_retry',
      event_id: accepted.event.event_id,
      provider: 'google'
    },
    {
      dispatch_mode: 'server_retry',
      event_id: accepted.event.event_id,
      provider: 'meta'
    }
  ])
  assert.equal(accepted.event.consent.marketing, 'granted')
  assert.deepEqual(accepted.event.browser_id, {
    ga_client_id: '1234567890.987654321',
    fbp: 'must-not-be-copied'
  })
  assert.equal(accepted.event.external_id, 'must-not-be-copied')
  assert.deepEqual(accepted.event.click_id, {
    fbclid: 'must-not-be-copied'
  })
  assert.equal(
    accepted.sourceEvidence?.source_event_id,
    observation.eventId
  )
  assert.equal(
    accepted.sourceEvidence?.source_api_version,
    '2026-04'
  )
  assert.doesNotThrow(() =>
    canonicalEventSourceEvidenceSchema.parse(
      accepted.sourceEvidence
    )
  )
})

test('does not promote v1, pre-cutover, or analytics-denied observations', async () => {
  const target = store()
  const inputs = [
    { ...observation, schemaVersion: 1 as const, correlation: undefined },
    {
      ...observation,
      occurredAt: '2026-08-04T09:59:59.999Z'
    },
    {
      ...observation,
      privacy: {
        ...observation.privacy,
        analyticsProcessingAllowed: false
      }
    }
  ]

  for (const input of inputs) {
    const result = await promoteShopifyAddPaymentInfoObservation(
      input as Parameters<
        typeof promoteShopifyAddPaymentInfoObservation
      >[0],
      {
        config: {
          enabled: true,
          cutoverAt: '2026-08-04T10:00:00.000Z'
        },
        environment: 'production',
        store: target.implementation
      }
    )
    assert.equal(result.status, 'not_applicable')
  }

  assert.equal(target.accepted.length, 0)
})

test('fails closed when the correlated source is incompatible', async () => {
  const target = store(
    canonicalBeginCheckoutSchema.parse({
      ...beginCheckout,
      custom_data: {
        ...beginCheckout.custom_data,
        currency: 'SEK'
      }
    })
  )

  await assert.rejects(
    promoteShopifyAddPaymentInfoObservation(observation, {
      config: {
        enabled: true,
        cutoverAt: '2026-08-04T10:04:00.000Z'
      },
      environment: 'production',
      store: target.implementation
    }),
    /canonical_begin_checkout_mismatch/
  )
  assert.equal(target.accepted.length, 0)
})
