import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  GoogleDataManagerStatusClaim,
  GoogleDataManagerStatusOutcome,
  GoogleDataManagerStatusStore
} from './googleDataManagerStatusTypes'
import { runGoogleDataManagerStatusReconciliation } from './runGoogleDataManagerStatusReconciliation'

function claim(index: number): GoogleDataManagerStatusClaim {
  return {
    attemptId: `attempt-${index}`,
    leaseToken: `lease-${index}`,
    requestId: `request-${index}`,
    statusCheckAttempts: 1
  }
}

function result(
  claimed: GoogleDataManagerStatusClaim,
  status: 'SUCCESS' | 'PROCESSING'
): GoogleDataManagerStatusOutcome {
  const base = {
    claim: claimed,
    latencyMs: 10,
    result: {
      destinationStatuses: [status],
      errorCounts: [],
      overallStatus: status,
      recordCount: 1,
      requestId: claimed.requestId,
      response: {},
      warningCounts: []
    }
  }

  if (status === 'SUCCESS') {
    return { ...base, status: 'succeeded' }
  }

  return {
    ...base,
    nextCheckAt: '2026-07-25T12:39:00.000Z',
    status: 'processing'
  }
}

test('claims, reconciles and completes a bounded batch', async () => {
  const queue = [claim(1), claim(2)]
  const completed: GoogleDataManagerStatusOutcome[] = []
  const store: GoogleDataManagerStatusStore = {
    claimNext: async () => queue.shift() ?? null,
    complete: async outcome => {
      completed.push(outcome)
    },
    expireStale: async () => 2
  }

  const summary = await runGoogleDataManagerStatusReconciliation(
    { maxItems: 5 },
    {
      reconcileAttempt: async claimed =>
        result(
          claimed,
          claimed.attemptId === 'attempt-1' ?
            'SUCCESS'
          : 'PROCESSING'
        ),
      store
    }
  )

  assert.deepEqual(summary, {
    claimed: 2,
    deadLettered: 0,
    limitReached: false,
    processing: 1,
    retried: 0,
    succeeded: 1,
    succeededWithWarnings: 0,
    timedOut: 2,
    unknown: 0
  })
  assert.deepEqual(
    completed.map(outcome => outcome.status).sort(),
    ['processing', 'succeeded']
  )
})

test('rejects invalid batch sizes', async () => {
  const store: GoogleDataManagerStatusStore = {
    claimNext: async () => null,
    complete: async () => undefined,
    expireStale: async () => 0
  }

  for (const maxItems of [0, 1.5, 101]) {
    await assert.rejects(
      runGoogleDataManagerStatusReconciliation(
        { maxItems },
        {
          reconcileAttempt: async claimed =>
            result(claimed, 'SUCCESS'),
          store
        }
      ),
      /maxItems must be between 1 and 100/
    )
  }
})
