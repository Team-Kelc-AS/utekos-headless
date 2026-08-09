import assert from 'node:assert/strict'
import test from 'node:test'

import type { ClaimedAbandonedCheckoutRecoveryDispatch } from './abandonedCheckoutRecoveryDispatch'
import { processAbandonedCheckoutRecoveryClaim } from './processAbandonedCheckoutRecoveryClaim'

const claim: ClaimedAbandonedCheckoutRecoveryDispatch = {
  dispatchId: '8d5dce25-4ed0-4ee5-9629-80eb99d1f24d',
  shopifyAbandonedCheckoutId: 'gid://shopify/AbandonedCheckout/1001',
  shopifyCustomerId: 'gid://shopify/Customer/2001',
  checkoutCreatedAt: '2026-08-09T08:00:00.000Z',
  checkoutUpdatedAt: '2026-08-09T08:20:00.000Z',
  sequenceVersion: 2,
  step: 2,
  dueAt: '2026-08-09T15:00:00.000Z',
  attemptCount: 0,
  processingExpiresAt: '2026-08-09T15:02:00.000Z'
}

const workerInput = {
  claim,
  workerId: 'recovery:test',
  retryDelayMs: 60_000
}

test('processor revalidates, delivers and completes an authorized claim', async () => {
  let completedEmailId: string | null = null

  const result = await processAbandonedCheckoutRecoveryClaim(workerInput, {
    revalidate: async () => ({
      authorized: true,
      to: 'kunde@example.no',
      recoveryUrl: 'https://checkout.shopify.com/recover/opaque',
      offerType: 'staycomfy',
      productImage: {
        url: 'https://cdn.shopify.com/example/comfyrobe.jpg',
        alt: 'Marineblå Comfyrobe'
      }
    }),
    renewLease: async () => true,
    deliverAuthorizedEmail: async input => {
      assert.equal(input.dispatchId, claim.dispatchId)
      assert.equal(input.step, 2)
      assert.equal(input.offerType, 'staycomfy')
      assert.equal(input.productImage?.alt, 'Marineblå Comfyrobe')
      assert.match(input.idempotencyKey, /v2:step-2$/)
      return { ok: true, resendEmailId: 'email_123' }
    },
    complete: async input => {
      completedEmailId = input.resendEmailId
      return true
    },
    suppress: async () => true,
    retry: async () => 'pending',
    now: () => new Date('2026-08-09T15:00:00.000Z')
  })

  assert.deepEqual(result, { status: 'sent' })
  assert.equal(completedEmailId, 'email_123')
})

test('processor suppresses without delivery when Shopify rejects the send', async () => {
  let delivered = false

  const result = await processAbandonedCheckoutRecoveryClaim(workerInput, {
    revalidate: async () => ({
      authorized: false,
      suppressionReason: 'not_subscribed'
    }),
    renewLease: async () => true,
    deliverAuthorizedEmail: async () => {
      delivered = true
      return { ok: true, resendEmailId: 'email_123' }
    },
    complete: async () => true,
    suppress: async () => true,
    retry: async () => 'pending',
    now: () => new Date('2026-08-09T15:00:00.000Z')
  })

  assert.equal(delivered, false)
  assert.deepEqual(result, {
    status: 'suppressed',
    suppressionReason: 'not_subscribed'
  })
})

test('processor schedules a retry when Resend rejects the email', async () => {
  const result = await processAbandonedCheckoutRecoveryClaim(workerInput, {
    revalidate: async () => ({
      authorized: true,
      to: 'kunde@example.no',
      recoveryUrl: 'https://checkout.shopify.com/recover/opaque',
      offerType: 'generic',
      productImage: null
    }),
    renewLease: async () => true,
    deliverAuthorizedEmail: async () => ({ ok: false }),
    complete: async () => true,
    suppress: async () => true,
    retry: async () => 'pending',
    now: () => new Date('2026-08-09T15:00:00.000Z')
  })

  assert.deepEqual(result, {
    status: 'retry_scheduled',
    errorCode: 'resend_provider_rejected'
  })
})
