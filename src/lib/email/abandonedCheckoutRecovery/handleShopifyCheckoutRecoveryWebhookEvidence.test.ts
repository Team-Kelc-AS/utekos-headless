import assert from 'node:assert/strict'
import test from 'node:test'

import { handleShopifyCheckoutRecoveryWebhookEvidence } from './handleShopifyCheckoutRecoveryWebhookEvidence'
import type { ShopifyCheckoutRecoveryWebhookEvidenceStore } from './shopifyCheckoutRecoveryWebhookEvidenceStore'

const evidence = {
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

function post(body: unknown, token = 'oidc-token') {
  return new Request(
    'https://utekos.no/api/internal/shopify/checkout-recovery-webhook-evidence',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  )
}

test('requires Vercel identity and strips raw email before storage', async () => {
  const persisted: unknown[] = []
  const store: ShopifyCheckoutRecoveryWebhookEvidenceStore = {
    persist: async value => {
      persisted.push(value)
      return { status: 'inserted', observationCount: 1 }
    }
  }

  const response = await handleShopifyCheckoutRecoveryWebhookEvidence(
    post(evidence),
    {
      verifyCaller: async request =>
        request.headers.get('authorization') === 'Bearer oidc-token',
      protectEmail: () => 'a'.repeat(64),
      store
    }
  )

  assert.equal(response.status, 204)
  assert.equal(JSON.stringify(persisted).includes('app@utekos.no'), false)
  assert.equal(
    (persisted[0] as { recipientFingerprint: string })
      .recipientFingerprint,
    'a'.repeat(64)
  )

  assert.equal(
    (await handleShopifyCheckoutRecoveryWebhookEvidence(
      post(evidence, 'wrong'),
      {
        verifyCaller: async () => false,
        protectEmail: () => 'a'.repeat(64),
        store
      }
    )).status,
    401
  )
})

test('rejects malformed and conflicting signed evidence', async () => {
  const store: ShopifyCheckoutRecoveryWebhookEvidenceStore = {
    persist: async () => ({ status: 'conflict', observationCount: 1 })
  }
  const dependencies = {
    verifyCaller: async () => true,
    protectEmail: () => 'a'.repeat(64),
    store
  }

  assert.equal(
    (await handleShopifyCheckoutRecoveryWebhookEvidence(
      post({ ...evidence, buyerAcceptsEmailMarketing: 'yes' }),
      dependencies
    )).status,
    400
  )
  assert.equal(
    (await handleShopifyCheckoutRecoveryWebhookEvidence(
      post(evidence),
      dependencies
    )).status,
    409
  )
})
