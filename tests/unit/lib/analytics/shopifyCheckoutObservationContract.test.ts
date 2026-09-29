import assert from 'node:assert/strict'
import test from 'node:test'
import { Validator } from '@cfworker/json-schema'
import type { Schema } from '@cfworker/json-schema'

import v1ContractSchema from '../../../../contracts/shopify/checkout-observation/v1/schema.json'
import v2ContractSchema from '../../../../contracts/shopify/checkout-observation/v2/schema.json'
import v3ContractSchema from '../../../../contracts/shopify/checkout-observation/v3/schema.json'
import v4ContractSchema from '../../../../contracts/shopify/checkout-observation/v4/schema.json'

import {
  shopifyCheckoutMetaObservationInputSchema,
  shopifyCheckoutObservationSchema,
  shopifyCheckoutPurchaseObservationSchema
} from '@/lib/analytics/shopifyCheckoutObservationContract'

const privacy = {
  analyticsProcessingAllowed: true,
  marketingAllowed: false,
  preferencesProcessingAllowed: false,
  saleOfDataAllowed: false
}

const shippingObservation = {
  contract: 'utekos.shopify.checkout_observation',
  schemaVersion: 1,
  source: 'shopify_app_web_pixel',
  verificationStatus: 'observed',
  eventId: 'shopify-event-1',
  eventName: 'checkout_shipping_info_submitted',
  eventSequence: 4,
  occurredAt: '2026-08-03T10:00:00.000Z',
  checkoutToken: 'checkout-token',
  commerce: {
    currencyCode: 'NOK',
    value: 1790,
    itemQuantity: 1
  },
  privacy
} as const

const canonicalPaymentObservation = {
  ...shippingObservation,
  schemaVersion: 2,
  eventId: 'shopify-event-payment-1',
  eventName: 'payment_info_submitted',
  correlation: {
    beginCheckoutEventId:
      '71c2ef59-6e6f-4f56-a63a-567ca398f9de'
  }
} as const

const canonicalShippingObservation = {
  ...shippingObservation,
  schemaVersion: 2,
  correlation: {
    beginCheckoutEventId:
      '71c2ef59-6e6f-4f56-a63a-567ca398f9de'
  }
} as const

const purchaseObservation = {
  contract: 'utekos.shopify.checkout_observation',
  schemaVersion: 4,
  source: 'shopify_app_web_pixel',
  verificationStatus: 'observed',
  eventId: 'shopify-event-purchase-1',
  eventName: 'checkout_completed',
  eventSequence: 7,
  occurredAt: '2026-09-29T12:00:00.000Z',
  checkoutToken: 'checkout-token',
  orderLegacyId: '12345',
  correlation: {
    beginCheckoutEventId:
      '71c2ef59-6e6f-4f56-a63a-567ca398f9de'
  },
  commerce: {
    currencyCode: 'NOK',
    value: 1790,
    itemQuantity: 1,
    tax: 358,
    shipping: 0,
    items: [
      {
        itemId: '456789',
        itemName: 'Utekos TechDown',
        quantity: 1,
        price: 1790,
        sku: 'TECHDOWN-MIDDELS',
        variantTitle: 'Middels'
      }
    ]
  },
  privacy
} as const

test('accepts a minimized checkout progress observation', () => {
  assert.deepEqual(
    shopifyCheckoutObservationSchema.parse(shippingObservation),
    shippingObservation
  )
})

test('accepts a v2 payment observation with only a PII-free canonical correlation', () => {
  assert.deepEqual(
    shopifyCheckoutObservationSchema.parse(
      canonicalPaymentObservation
    ),
    canonicalPaymentObservation
  )
})

test('accepts a v2 shipping observation with only a PII-free canonical correlation', () => {
  assert.deepEqual(
    shopifyCheckoutObservationSchema.parse(
      canonicalShippingObservation
    ),
    canonicalShippingObservation
  )
})

test('rejects a v2 payment observation without a valid begin-checkout UUID', () => {
  assert.equal(
    shopifyCheckoutObservationSchema.safeParse({
      ...canonicalPaymentObservation,
      correlation: {
        beginCheckoutEventId: 'checkout-token'
      }
    }).success,
    false
  )
})

test('accepts an allowlisted alert type without free text', () => {
  const alertObservation = {
    contract: 'utekos.shopify.checkout_observation',
    schemaVersion: 1,
    source: 'shopify_app_web_pixel',
    verificationStatus: 'observed',
    eventId: 'shopify-event-2',
    eventName: 'alert_displayed',
    eventSequence: 5,
    occurredAt: '2026-08-03T10:00:01.000Z',
    alert: {
      type: 'PAYMENT_ERROR'
    },
    privacy
  }

  assert.equal(
    shopifyCheckoutObservationSchema.parse(alertObservation)
      .eventName,
    'alert_displayed'
  )
})

test('accepts PII-free contact and delivery validation alerts', () => {
  for (const type of [
    'CONTACT_ERROR',
    'DELIVERY_ERROR'
  ] as const) {
    assert.equal(
      shopifyCheckoutObservationSchema.safeParse({
        contract: 'utekos.shopify.checkout_observation',
        schemaVersion: 1,
        source: 'shopify_app_web_pixel',
        verificationStatus: 'observed',
        eventId: `shopify-event-${type}`,
        eventName: 'alert_displayed',
        eventSequence: 5,
        occurredAt: '2026-08-03T10:00:01.000Z',
        alert: { type },
        privacy
      }).success,
      true
    )
  }
})

test('rejects PII, canonical claims, and provider fields from v1 observations', () => {
  for (const forbiddenField of [
    'email',
    'canonicalEventName',
    'provider'
  ]) {
    assert.equal(
      shopifyCheckoutObservationSchema.safeParse({
        ...shippingObservation,
        [forbiddenField]: 'forbidden'
      }).success,
      false
    )
  }
})

test('rejects alert free text and non-allowlisted alert types', () => {
  const commonAlert = {
    contract: 'utekos.shopify.checkout_observation',
    schemaVersion: 1,
    source: 'shopify_app_web_pixel',
    verificationStatus: 'observed',
    eventId: 'shopify-event-3',
    eventName: 'alert_displayed',
    eventSequence: 6,
    occurredAt: '2026-08-03T10:00:02.000Z',
    privacy
  }

  assert.equal(
    shopifyCheckoutObservationSchema.safeParse({
      ...commonAlert,
      alert: {
        type: 'PAYMENT_ERROR',
        message: 'Card was declined'
      }
    }).success,
    false
  )

  assert.equal(
    shopifyCheckoutObservationSchema.safeParse({
      ...commonAlert,
      alert: {
        type: 'DISCOUNT_ERROR'
      }
    }).success,
    false
  )
})

test('requires a currency when a commerce value is present', () => {
  assert.equal(
    shopifyCheckoutObservationSchema.safeParse({
      ...shippingObservation,
      commerce: {
        ...shippingObservation.commerce,
        currencyCode: null
      }
    }).success,
    false
  )
})

test('the normative v1 JSON Schema enforces the same strict boundary', () => {
  const validator = new Validator(
    v1ContractSchema as Schema,
    '2020-12',
    false
  )

  assert.equal(
    validator.validate(shippingObservation).valid,
    true
  )

  assert.equal(
    validator.validate({
      ...shippingObservation,
      email: 'never@example.test'
    }).valid,
    false
  )

  assert.equal(
    validator.validate({
      ...shippingObservation,
      commerce: {
        ...shippingObservation.commerce,
        currencyCode: null
      }
    }).valid,
    false
  )
})

test('the normative v2 JSON Schema rejects PII and unknown correlation fields', () => {
  const validator = new Validator(
    v2ContractSchema as Schema,
    '2020-12',
    false
  )

  assert.equal(
    validator.validate(canonicalPaymentObservation).valid,
    true
  )

  assert.equal(
    validator.validate({
      ...canonicalPaymentObservation,
      email: 'never@example.test'
    }).valid,
    false
  )

  assert.equal(
    validator.validate({
      ...canonicalPaymentObservation,
      correlation: {
        ...canonicalPaymentObservation.correlation,
        checkoutEmailHash: 'forbidden'
      }
    }).valid,
    false
  )
})

test('the v3 ingress contract requires marketing consent and limits completion to an order id', () => {
  const input = {
    ...canonicalShippingObservation,
    schemaVersion: 3,
    customer: {
      email: 'kari@example.no'
    },
    privacy: {
      ...privacy,
      marketingAllowed: true,
      saleOfDataAllowed: true
    }
  } as const

  const validator = new Validator(
    v3ContractSchema as Schema,
    '2020-12',
    false
  )

  assert.equal(
    shopifyCheckoutMetaObservationInputSchema.safeParse(input)
      .success,
    true
  )

  assert.equal(
    validator.validate(input).valid,
    true
  )

  assert.equal(
    validator.validate({
      ...input,
      privacy: {
        ...input.privacy,
        marketingAllowed: false
      }
    }).valid,
    false
  )

  assert.equal(
    validator.validate({
      ...input,
      eventName: 'checkout_completed'
    }).valid,
    false
  )

  assert.equal(
    validator.validate({
      ...input,
      eventName: 'checkout_completed',
      orderLegacyId: '12345'
    }).valid,
    true
  )
})

test('accepts a complete provider-neutral v4 checkout completion observation', () => {
  assert.deepEqual(
    shopifyCheckoutPurchaseObservationSchema.parse(
      purchaseObservation
    ),
    purchaseObservation
  )

  assert.deepEqual(
    shopifyCheckoutObservationSchema.parse(
      purchaseObservation
    ),
    purchaseObservation
  )
})

test('v4 purchase does not require marketing or sale-of-data consent', () => {
  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse(
      purchaseObservation
    ).success,
    true
  )

  assert.equal(
    purchaseObservation.privacy.marketingAllowed,
    false
  )

  assert.equal(
    purchaseObservation.privacy.saleOfDataAllowed,
    false
  )
})

test('v4 begin-checkout correlation is optional', () => {
  const {
    correlation: _correlation,
    ...withoutCorrelation
  } = purchaseObservation

  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse(
      withoutCorrelation
    ).success,
    true
  )
})

test('v4 correlation must contain a valid begin-checkout UUID when present', () => {
  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse({
      ...purchaseObservation,
      correlation: {
        beginCheckoutEventId: 'checkout-token'
      }
    }).success,
    false
  )
})

test('v4 requires the Shopify order identity', () => {
  const {
    orderLegacyId: _orderLegacyId,
    ...withoutOrder
  } = purchaseObservation

  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse(
      withoutOrder
    ).success,
    false
  )

  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse({
      ...purchaseObservation,
      orderLegacyId: 'gid://shopify/Order/12345'
    }).success,
    false
  )
})

test('v4 requires complete purchase commerce identity', () => {
  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse({
      ...purchaseObservation,
      commerce: {
        ...purchaseObservation.commerce,
        currencyCode: null
      }
    }).success,
    false
  )

  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse({
      ...purchaseObservation,
      commerce: {
        ...purchaseObservation.commerce,
        itemQuantity: 0
      }
    }).success,
    false
  )

  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse({
      ...purchaseObservation,
      commerce: {
        ...purchaseObservation.commerce,
        itemQuantity: 1_000_001
      }
    }).success,
    false
  )

  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse({
      ...purchaseObservation,
      commerce: {
        ...purchaseObservation.commerce,
        items: []
      }
    }).success,
    false
  )
})

test('v4 rejects invalid purchased line items', () => {
  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse({
      ...purchaseObservation,
      commerce: {
        ...purchaseObservation.commerce,
        items: [
          {
            ...purchaseObservation.commerce.items[0],
            itemId: 'gid://shopify/ProductVariant/456789'
          }
        ]
      }
    }).success,
    false
  )

  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse({
      ...purchaseObservation,
      commerce: {
        ...purchaseObservation.commerce,
        items: [
          {
            ...purchaseObservation.commerce.items[0],
            quantity: 0
          }
        ]
      }
    }).success,
    false
  )
})

test('v4 rejects raw PII, customer objects, and provider-native fields', () => {
  for (const forbidden of [
    {
      email: 'never@example.test'
    },
    {
      customer: {
        email: 'never@example.test'
      }
    },
    {
      provider: 'meta'
    },
    {
      transaction_id: 'shopify_order_12345'
    },
    {
      eventID:
        '9f213c99-e929-46b8-a9fb-ec19f56c8e2a'
    }
  ]) {
    assert.equal(
      shopifyCheckoutPurchaseObservationSchema.safeParse({
        ...purchaseObservation,
        ...forbidden
      }).success,
      false
    )
  }
})

test('the normative v4 JSON Schema and runtime accept the same valid purchase boundary', () => {
  const validator = new Validator(
    v4ContractSchema as Schema,
    '2020-12',
    false
  )

  assert.equal(
    validator.validate(purchaseObservation).valid,
    true
  )

  assert.equal(
    shopifyCheckoutPurchaseObservationSchema.safeParse(
      purchaseObservation
    ).success,
    true
  )
})

test('the normative v4 JSON Schema allows missing correlation but rejects malformed correlation', () => {
  const validator = new Validator(
    v4ContractSchema as Schema,
    '2020-12',
    false
  )

  const {
    correlation: _correlation,
    ...withoutCorrelation
  } = purchaseObservation

  assert.equal(
    validator.validate(withoutCorrelation).valid,
    true
  )

  assert.equal(
    validator.validate({
      ...purchaseObservation,
      correlation: {
        beginCheckoutEventId: 'not-a-uuid'
      }
    }).valid,
    false
  )
})

test('the normative v4 JSON Schema rejects incomplete or identifying purchase payloads', () => {
  const validator = new Validator(
    v4ContractSchema as Schema,
    '2020-12',
    false
  )

  assert.equal(
    validator.validate({
      ...purchaseObservation,
      email: 'never@example.test'
    }).valid,
    false
  )

  assert.equal(
    validator.validate({
      ...purchaseObservation,
      commerce: {
        ...purchaseObservation.commerce,
        items: []
      }
    }).valid,
    false
  )

  assert.equal(
    validator.validate({
      ...purchaseObservation,
      commerce: {
        ...purchaseObservation.commerce,
        itemQuantity: 1_000_001
      }
    }).valid,
    false
  )
})