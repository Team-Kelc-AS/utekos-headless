import assert from 'node:assert/strict'
import test from 'node:test'

import {
  runAbandonedCheckoutRecoveryDispatchBatch
} from './runAbandonedCheckoutRecoveryDispatchBatch'

const baseClaim = {
  dispatchId: '11111111-1111-4111-8111-111111111111',
  shopifyAbandonedCheckoutId: 'gid://shopify/AbandonedCheckout/1',
  shopifyCustomerId: 'gid://shopify/Customer/2',
  sequenceVersion: 3,
  step: 1,
  checkoutCreatedAt: '2026-08-20T08:00:00.000Z',
  checkoutUpdatedAt: '2026-08-20T08:01:00.000Z',
  dueAt: '2026-08-20T12:00:00.000Z',
  attemptCount: 0,
  processingExpiresAt: '2026-08-22T08:02:00.000Z'
}

test('returns only aggregate PII-free dispatch counts', async () => {
  const statuses = [
    { status: 'sent' as const },
    {
      status: 'suppressed' as const,
      suppressionReason: 'recovered' as const
    },
    {
      status: 'retry_scheduled' as const,
      errorCode: 'resend_provider_rejected' as const
    }
  ]

  const summary = await runAbandonedCheckoutRecoveryDispatchBatch(
    { workerId: 'worker:test', limit: 3 },
    {
      now: () => new Date('2026-08-22T08:00:00.000Z'),
      claim: async input => {
        assert.equal(input.limit, 3)
        return statuses.map((_, index) => ({
          ...baseClaim,
          dispatchId: `${index + 1}1111111-1111-4111-8111-111111111111`
        }))
      },
      processClaim: async (_claim, _workerId) =>
        statuses.shift()!
    }
  )

  assert.deepEqual(summary, {
    claimed: 3,
    sent: 1,
    suppressed: 1,
    retryScheduled: 1,
    failed: 0,
    ownershipLost: 0
  })
  assert.equal('email' in summary, false)
  assert.equal('recoveryUrl' in summary, false)
})
