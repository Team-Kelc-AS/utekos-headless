import assert from 'node:assert/strict'
import test from 'node:test'

import { claimAbandonedCheckoutRecoveryDispatches } from './claimAbandonedCheckoutRecoveryDispatches'
import {
  completeAbandonedCheckoutRecoveryDispatch,
  retryAbandonedCheckoutRecoveryDispatch,
  suppressAbandonedCheckoutRecoveryDispatch
} from './transitionAbandonedCheckoutRecoveryDispatch'

const now = new Date('2026-08-09T15:00:00.000Z')
const dispatchId = '8d5dce25-4ed0-4ee5-9629-80eb99d1f24d'

test('claim port validates and maps the bounded RPC result', async () => {
  const rows = await claimAbandonedCheckoutRecoveryDispatches(
    { workerId: 'recovery:test', limit: 1, now },
    {
      executeClaimRpc: async args => {
        assert.equal(args.p_limit, 1)
        return {
          data: [
            {
              id: dispatchId,
              shopify_abandoned_checkout_id:
                'gid://shopify/AbandonedCheckout/1001',
              shopify_customer_id: 'gid://shopify/Customer/2001',
              sequence_version: 2,
              step: 1,
              checkout_created_at: '2026-08-09T08:00:00.000Z',
              checkout_updated_at: '2026-08-09T08:20:00.000Z',
              due_at: '2026-08-09T09:00:00.000Z',
              attempt_count: 0,
              processing_expires_at: '2026-08-09T15:02:00.000Z'
            }
          ],
          error: null
        }
      }
    }
  )

  assert.equal(rows.length, 1)
  assert.equal(rows[0]?.dispatchId, dispatchId)
  assert.equal(rows[0]?.sequenceVersion, 2)
})

test('transition ports call the exact complete, suppress and retry RPCs', async () => {
  const names: string[] = []
  const executeTransitionRpc = async (call: { name: string }) => {
    names.push(call.name)
    return {
      data: call.name === 'retry_abandoned_checkout_recovery_dispatch' ?
          'pending'
        : true,
      error: null
    }
  }

  await completeAbandonedCheckoutRecoveryDispatch(
    {
      dispatchId,
      workerId: 'recovery:test',
      resendEmailId: 'email_123',
      now
    },
    { executeTransitionRpc }
  )
  await suppressAbandonedCheckoutRecoveryDispatch(
    {
      dispatchId,
      workerId: 'recovery:test',
      suppressionReason: 'not_subscribed',
      now
    },
    { executeTransitionRpc }
  )
  await retryAbandonedCheckoutRecoveryDispatch(
    {
      dispatchId,
      workerId: 'recovery:test',
      errorCode: 'resend_provider_rejected',
      retryAt: new Date('2026-08-09T15:05:00.000Z'),
      maxAttempts: 3,
      now
    },
    { executeTransitionRpc }
  )

  assert.deepEqual(names, [
    'complete_abandoned_checkout_recovery_dispatch',
    'suppress_abandoned_checkout_recovery_dispatch',
    'retry_abandoned_checkout_recovery_dispatch'
  ])
})
