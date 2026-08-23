import assert from 'node:assert/strict'
import test from 'node:test'

import type { ShopifyCheckoutRecoveryEvidenceStore } from './shopifyCheckoutRecoveryEvidenceStore'
import { handleShopifyCheckoutRecoveryEvidence } from './handleShopifyCheckoutRecoveryEvidence'

const body = {
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

function post(candidate: unknown) {
  return new Request(
    'https://utekos.no/api/shopify/checkout-recovery-evidence',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate)
    }
  )
}

test('protects email before persistence and returns no body', async () => {
  const persisted: unknown[] = []
  const store: ShopifyCheckoutRecoveryEvidenceStore = {
    persist: async evidence => {
      persisted.push(evidence)
      return { status: 'inserted', observationCount: 1 }
    }
  }

  const response = await handleShopifyCheckoutRecoveryEvidence(
    post(body),
    {
      enabled: true,
      protectEmail: email => {
        assert.equal(email, 'app@utekos.no')
        return 'a'.repeat(64)
      },
      store
    }
  )

  assert.equal(response.status, 204)
  assert.equal(await response.text(), '')
  assert.equal(JSON.stringify(persisted).includes('app@utekos.no'), false)
  assert.deepEqual(persisted, [
    {
      ...body,
      recipientFingerprint: 'a'.repeat(64),
      email: undefined
    }
  ].map(({ email: _, ...value }) => value))
})

test('rejects disabled, malformed, and conflicting evidence', async () => {
  const store: ShopifyCheckoutRecoveryEvidenceStore = {
    persist: async () => ({ status: 'conflict', observationCount: 1 })
  }

  assert.equal(
    (await handleShopifyCheckoutRecoveryEvidence(post(body), {
      enabled: false,
      protectEmail: () => 'a'.repeat(64),
      store
    })).status,
    404
  )
  assert.equal(
    (await handleShopifyCheckoutRecoveryEvidence(post({
      ...body,
      address1: 'must not cross boundary'
    }), {
      enabled: true,
      protectEmail: () => 'a'.repeat(64),
      store
    })).status,
    400
  )
  assert.equal(
    (await handleShopifyCheckoutRecoveryEvidence(post(body), {
      enabled: true,
      protectEmail: () => 'a'.repeat(64),
      store
    })).status,
    409
  )
})
