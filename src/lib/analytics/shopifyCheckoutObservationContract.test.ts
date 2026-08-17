import assert from 'node:assert/strict'
import test from 'node:test'
import { Validator } from '@cfworker/json-schema'
import type { Schema } from '@cfworker/json-schema'
import v1ContractSchema from '../../../contracts/shopify/checkout-observation/v1/schema.json'
import v2ContractSchema from '../../../contracts/shopify/checkout-observation/v2/schema.json'
import { shopifyCheckoutObservationSchema } from './shopifyCheckoutObservationContract'

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
      correlation: { beginCheckoutEventId: 'checkout-token' }
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
    alert: { type: 'PAYMENT_ERROR' },
    privacy
  }

  assert.equal(
    shopifyCheckoutObservationSchema.parse(alertObservation)
      .eventName,
    'alert_displayed'
  )
})

test('rejects PII, canonical claims, and provider fields', () => {
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
      alert: { type: 'CONTACT_ERROR' }
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

test('the normative JSON Schema enforces the same strict boundary', () => {
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
