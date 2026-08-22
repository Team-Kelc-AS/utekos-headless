import assert from 'node:assert/strict'
import test from 'node:test'

import {
  processAbandonedCheckoutRecoveryClaim
} from './processAbandonedCheckoutRecoveryClaim'

const claim = {
  dispatchId: '11111111-1111-4111-8111-111111111111',
  shopifyAbandonedCheckoutId:
    'gid://shopify/AbandonedCheckout/100',
  shopifyCustomerId: 'gid://shopify/Customer/200',
  sequenceVersion: 3,
  step: 2,
  checkoutCreatedAt: '2026-08-20T08:00:00.000Z',
  checkoutUpdatedAt: '2026-08-20T08:05:00.000Z',
  dueAt: '2026-08-21T08:00:00.000Z',
  attemptCount: 0,
  processingExpiresAt: '2026-08-22T08:02:00.000Z'
}

const protectedAudit = {
  recipientCiphertext:
    `v1.${'a'.repeat(16)}.${'b'.repeat(20)}.${'c'.repeat(22)}`,
  recipientFingerprint: 'd'.repeat(64),
  recoveryUrlCiphertext:
    `v1.${'e'.repeat(16)}.${'f'.repeat(30)}.${'g'.repeat(22)}`,
  recoveryUrlFingerprint: 'a'.repeat(64)
}

test('protects delivery evidence before sending and completes with Resend id', async () => {
  const calls: string[] = []

  const result = await processAbandonedCheckoutRecoveryClaim(
    { claim, workerId: 'worker:test' },
    {
      now: () => new Date('2026-08-22T08:00:00.000Z'),
      revalidate: async () => ({
        authorized: true,
        to: 'kunde@example.com',
        recoveryUrl: 'https://checkout.example/recover?token=secret'
      }),
      renewLease: async () => true,
      protectDeliveryAudit: input => {
        calls.push('protect')
        assert.equal(input.recipient, 'kunde@example.com')
        assert.match(input.recoveryUrl, /token=secret/u)
        return protectedAudit
      },
      deliverAuthorizedEmail: async input => {
        calls.push('deliver')
        assert.equal(input.dispatchId, claim.dispatchId)
        assert.equal(input.sequenceVersion, 3)
        assert.equal(input.step, 2)
        return {
          ok: true,
          resendEmailId: 'resend_email_123'
        }
      },
      complete: async input => {
        calls.push('complete')
        assert.equal(input.resendEmailId, 'resend_email_123')
        assert.deepEqual(input.protectedAudit, protectedAudit)
        return true
      },
      retry: async () => {
        throw new Error('retry must not run')
      },
      suppress: async () => {
        throw new Error('suppress must not run')
      }
    }
  )

  assert.deepEqual(calls, ['protect', 'deliver', 'complete'])
  assert.deepEqual(result, { status: 'sent' })
})

test('fails closed before Resend when audit protection is unavailable', async () => {
  let delivered = false
  let retriedErrorCode = ''

  const result = await processAbandonedCheckoutRecoveryClaim(
    { claim, workerId: 'worker:test' },
    {
      now: () => new Date('2026-08-22T08:00:00.000Z'),
      revalidate: async () => ({
        authorized: true,
        to: 'kunde@example.com',
        recoveryUrl: 'https://checkout.example/recover'
      }),
      renewLease: async () => true,
      protectDeliveryAudit: () => {
        throw new Error('missing key')
      },
      deliverAuthorizedEmail: async () => {
        delivered = true
        return { ok: true, resendEmailId: 'must_not_send' }
      },
      retry: async input => {
        retriedErrorCode = input.errorCode
        return 'pending'
      },
      complete: async () => {
        throw new Error('complete must not run')
      },
      suppress: async () => {
        throw new Error('suppress must not run')
      }
    }
  )

  assert.equal(delivered, false)
  assert.equal(retriedErrorCode, 'delivery_audit_failed')
  assert.deepEqual(result, {
    status: 'retry_scheduled',
    errorCode: 'delivery_audit_failed'
  })
})
