import assert from 'node:assert/strict'
import test from 'node:test'
import type { ShopifyCheckoutObservation } from '../shopifyCheckoutObservationContract'
import {
  handleShopifyCheckoutObservation,
  MAX_SHOPIFY_CHECKOUT_OBSERVATION_BYTES
} from './handleShopifyCheckoutObservation'
import type {
  ShopifyCheckoutObservationStore,
  ShopifyCheckoutObservationWriteResult
} from './shopifyCheckoutObservationStore'

const privacy = {
  analyticsProcessingAllowed: true,
  marketingAllowed: false,
  preferencesProcessingAllowed: false,
  saleOfDataAllowed: false
}

const commonObservation = {
  contract: 'utekos.shopify.checkout_observation',
  schemaVersion: 1,
  source: 'shopify_app_web_pixel',
  verificationStatus: 'observed',
  eventId: 'shopify-event-1',
  eventSequence: 1,
  occurredAt: '2026-08-03T10:00:00.000Z',
  privacy
} as const

const observations = [
  {
    ...commonObservation,
    eventName: 'checkout_shipping_info_submitted',
    checkoutToken: 'checkout-token',
    commerce: {
      currencyCode: 'NOK',
      value: 1790,
      itemQuantity: 1
    }
  },
  {
    ...commonObservation,
    eventId: 'shopify-event-2',
    eventName: 'payment_info_submitted',
    checkoutToken: 'checkout-token',
    commerce: {
      currencyCode: 'NOK',
      value: 1790,
      itemQuantity: 1
    }
  },
  {
    ...commonObservation,
    eventId: 'shopify-event-3',
    eventName: 'alert_displayed',
    alert: { type: 'CHECKOUT_ERROR' }
  },
  {
    ...commonObservation,
    eventId: 'shopify-event-4',
    eventName: 'alert_displayed',
    alert: { type: 'PAYMENT_ERROR' }
  }
] as const

class TestStore implements ShopifyCheckoutObservationStore {
  readonly persisted: ShopifyCheckoutObservation[] = []

  constructor(
    private readonly result: ShopifyCheckoutObservationWriteResult = {
      status: 'inserted',
      observationCount: 1
    }
  ) {}

  async persist(observation: ShopifyCheckoutObservation) {
    this.persisted.push(observation)
    return this.result
  }
}

function post(
  body: string,
  store: ShopifyCheckoutObservationStore,
  promote?: Parameters<
    typeof handleShopifyCheckoutObservation
  >[1]['promote']
) {
  return handleShopifyCheckoutObservation(
    new Request(
      'http://localhost/api/development/shopify/checkout-observations',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      }
    ),
    { enabled: true, store, ...(promote ? { promote } : {}) }
  )
}

test('accepts all four checkout observation categories', async () => {
  const store = new TestStore()

  for (const observation of observations) {
    const response = await post(
      JSON.stringify(observation),
      store
    )
    assert.equal(response.status, 204)
    assert.equal(
      response.headers.get(
        'X-Shopify-Checkout-Observation-Result'
      ),
      'inserted'
    )
  }

  assert.equal(store.persisted.length, 4)
  assert.deepEqual(
    store.persisted.map(observation =>
      observation.eventName === 'alert_displayed' ?
        observation.alert.type
      : observation.eventName
    ),
    [
      'checkout_shipping_info_submitted',
      'payment_info_submitted',
      'CHECKOUT_ERROR',
      'PAYMENT_ERROR'
    ]
  )
})

test('exposes the canonical promotion result after observed persistence', async () => {
  const store = new TestStore()
  const response = await post(
    JSON.stringify({
      ...observations[1],
      schemaVersion: 2,
      correlation: {
        beginCheckoutEventId:
          '71c2ef59-6e6f-4f56-a63a-567ca398f9de'
      }
    }),
    store,
    async () => ({
      eventId: '4487f69d-7b0b-4a62-a349-748c2fe20e16',
      status: 'inserted'
    })
  )

  assert.equal(response.status, 204)
  assert.equal(
    response.headers.get('X-Shopify-Checkout-Canonical-Result'),
    'inserted'
  )
  assert.equal(store.persisted.length, 1)
})

test('keeps the observation and returns a sanitized retryable error when promotion is unavailable', async () => {
  const store = new TestStore()
  const response = await post(
    JSON.stringify({
      ...observations[1],
      schemaVersion: 2,
      correlation: {
        beginCheckoutEventId:
          '71c2ef59-6e6f-4f56-a63a-567ca398f9de'
      }
    }),
    store,
    async () => {
      throw new Error('database connection string must not leak')
    }
  )

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    accepted: false,
    reason: 'canonical_promotion_unavailable'
  })
  assert.equal(store.persisted.length, 1)
})

test('rejects PII before storage', async () => {
  const store = new TestStore()
  const response = await post(
    JSON.stringify({
      ...observations[0],
      email: 'never@example.test'
    }),
    store
  )

  assert.equal(response.status, 400)
  assert.equal(store.persisted.length, 0)
})

test('rejects a body larger than 16 KiB before storage', async () => {
  const store = new TestStore()
  const response = await post(
    'x'.repeat(MAX_SHOPIFY_CHECKOUT_OBSERVATION_BYTES + 1),
    store
  )

  assert.equal(response.status, 413)
  assert.equal(store.persisted.length, 0)
})

test('rejects invalid UTF-8 before storage', async () => {
  const store = new TestStore()
  const response = await handleShopifyCheckoutObservation(
    new Request(
      'http://localhost/api/development/shopify/checkout-observations',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: new Uint8Array([0xff])
      }
    ),
    { enabled: true, store }
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    accepted: false,
    reason: 'invalid_body'
  })
  assert.equal(store.persisted.length, 0)
})

test('maps a replay conflict to a sanitized 409', async () => {
  const response = await post(
    JSON.stringify(observations[0]),
    new TestStore({ status: 'conflict', observationCount: 1 })
  )

  assert.equal(response.status, 409)
  assert.deepEqual(await response.json(), {
    accepted: false,
    reason: 'idempotency_conflict'
  })
})

test('sanitizes storage failures', async () => {
  const response = await post(JSON.stringify(observations[0]), {
    async persist() {
      throw new Error('local path and payload must not leak')
    }
  })

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    accepted: false,
    reason: 'storage_unavailable'
  })
})

test('fails closed when the receiver is disabled', async () => {
  const store = new TestStore()
  const response = await handleShopifyCheckoutObservation(
    new Request(
      'http://localhost/api/development/shopify/checkout-observations',
      { method: 'POST' }
    ),
    { enabled: false, store }
  )

  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), {
    accepted: false,
    reason: 'receiver_disabled'
  })
  assert.equal(store.persisted.length, 0)
})
