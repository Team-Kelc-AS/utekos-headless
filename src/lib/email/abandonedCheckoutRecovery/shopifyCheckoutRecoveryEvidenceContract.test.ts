import assert from 'node:assert/strict'
import test from 'node:test'

import {
  shopifyCheckoutRecoveryEvidenceSchema,
  shopifyCheckoutRecoveryWebhookEvidenceSchema
} from './shopifyCheckoutRecoveryEvidenceContract'

const evidence = {
  contract: 'utekos.shopify.checkout_recovery_evidence',
  schemaVersion: 1,
  source: 'shopify_app_web_pixel',
  verificationStatus: 'observed',
  eventId: 'contact-event-1',
  eventName: 'checkout_contact_info_submitted',
  eventSequence: 3,
  occurredAt: '2026-08-22T07:40:00.000Z',
  checkoutToken: 'checkout-token-1',
  beginCheckoutEventId:
    '71c2ef59-6e6f-4f56-a63a-567ca398f9de',
  email: 'app@utekos.no',
  buyerAcceptsEmailMarketing: true,
  buyerAcceptsSmsMarketing: false,
  fieldPresence: {
    contactPhone: false,
    firstName: false,
    lastName: false,
    address1: false,
    address2: false,
    city: false,
    countryCode: false,
    postalCode: false,
    shippingPhone: false
  }
} as const

test('accepts exact checkout email marketing evidence', () => {
  assert.deepEqual(
    shopifyCheckoutRecoveryEvidenceSchema.parse(evidence),
    evidence
  )
})

test('accepts address submission without requiring name fields', () => {
  assert.equal(
    shopifyCheckoutRecoveryEvidenceSchema.parse({
      ...evidence,
      eventName: 'checkout_address_info_submitted'
    }).fieldPresence.firstName,
    false
  )
})

test('rejects missing correlation and unknown raw delivery fields', () => {
  const { beginCheckoutEventId: _, ...withoutCorrelation } = evidence

  assert.equal(
    shopifyCheckoutRecoveryEvidenceSchema.safeParse(
      withoutCorrelation
    ).success,
    false
  )
  assert.equal(
    shopifyCheckoutRecoveryEvidenceSchema.safeParse({
      ...evidence,
      firstName: 'Kari',
      address1: 'Hemmeligveien 1',
      phone: '+4799999999'
    }).success,
    false
  )
})

test('rejects invalid email and timestamps', () => {
  assert.equal(
    shopifyCheckoutRecoveryEvidenceSchema.safeParse({
      ...evidence,
      email: 'not-email'
    }).success,
    false
  )
  assert.equal(
    shopifyCheckoutRecoveryEvidenceSchema.safeParse({
      ...evidence,
      occurredAt: 'yesterday'
    }).success,
    false
  )
})

test('accepts HMAC-verified checkouts/update evidence as schema v2', () => {
  const verifiedEvidence = {
    contract: 'utekos.shopify.checkout_recovery_evidence',
    schemaVersion: 2,
    source: 'shopify_checkouts_update_webhook',
    verificationStatus: 'shopify_hmac_verified',
    webhookId: '6d438f6d-f687-4ebc-a268-664112f710e1',
    eventName: 'checkouts/update',
    occurredAt: '2026-08-22T07:40:00.000Z',
    checkoutCreatedAt: '2026-08-22T07:30:00.000Z',
    checkoutToken: 'checkout-token-1',
    beginCheckoutEventId:
      '71c2ef59-6e6f-4f56-a63a-567ca398f9de',
    email: 'app@utekos.no',
    buyerAcceptsEmailMarketing: true,
    shopDomain: 'erling-7921.myshopify.com'
  } as const

  assert.deepEqual(
    shopifyCheckoutRecoveryWebhookEvidenceSchema.parse(
      verifiedEvidence
    ),
    verifiedEvidence
  )
  assert.equal(
    shopifyCheckoutRecoveryWebhookEvidenceSchema.safeParse({
      ...verifiedEvidence,
      verificationStatus: 'observed'
    }).success,
    false
  )
})
