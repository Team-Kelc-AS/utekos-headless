import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  GoogleDataManagerProviderStatus,
  GoogleDataManagerStatusClaim
} from './googleDataManagerStatusTypes'
import { reconcileGoogleDataManagerStatusAttempt } from './reconcileGoogleDataManagerStatusAttempt'

const claim: GoogleDataManagerStatusClaim = {
  attemptId: 'attempt-1',
  leaseToken: 'lease-1',
  requestId: 'request-1',
  statusCheckAttempts: 1
}

function clocks() {
  const values = [1_000, 1_125]
  return () => values.shift() ?? 1_125
}

test('maps every provider status to the matching outbox outcome', async () => {
  for (const [providerStatus, outcomeStatus] of [
    ['SUCCESS', 'succeeded'],
    ['PROCESSING', 'processing'],
    ['FAILED', 'failed'],
    ['PARTIAL_SUCCESS', 'partial_success'],
    ['REQUEST_STATUS_UNKNOWN', 'unknown']
  ] as const) {
    const outcome =
      await reconcileGoogleDataManagerStatusAttempt(claim, {
        now: clocks(),
        random: () => 0,
        retrieveStatus: async requestId => ({
          destinationStatuses: [
            providerStatus as GoogleDataManagerProviderStatus
          ],
          errorCounts: [],
          overallStatus: providerStatus,
          recordCount: 1,
          requestId,
          response: {},
          warningCounts: []
        })
      })

    assert.equal(outcome.status, outcomeStatus)
    assert.equal(outcome.latencyMs, 125)
  }
})

test('turns status API errors into bounded retries', async () => {
  const outcome = await reconcileGoogleDataManagerStatusAttempt(
    claim,
    {
      now: clocks(),
      random: () => 0,
      retrieveStatus: async () => {
        throw new Error('temporary status error')
      }
    }
  )

  assert.equal(outcome.status, 'retry')
  assert.equal(outcome.latencyMs, 125)
  assert.equal(
    outcome.status === 'retry' ? outcome.errorMessage : null,
    'temporary status error'
  )
  assert.equal(
    outcome.nextCheckAt,
    new Date(1_125 + 39 * 60_000).toISOString()
  )
})

test('keeps successful requests with warnings out of green status', async () => {
  const outcome = await reconcileGoogleDataManagerStatusAttempt(
    claim,
    {
      now: clocks(),
      random: () => 0,
      retrieveStatus: async requestId => ({
        destinationStatuses: ['SUCCESS'],
        errorCounts: [],
        overallStatus: 'SUCCESS',
        recordCount: 1,
        requestId,
        response: {},
        warningCounts: [
          {
            reason: 'PROCESSING_WARNING_REASON_INTERNAL_ERROR',
            recordCount: 1
          }
        ]
      })
    }
  )

  assert.equal(outcome.status, 'succeeded_with_warnings')
})

test('dead-letters success with errors or an unexpected record count', async () => {
  for (const diagnostics of [
    {
      errorCounts: [
        {
          reason: 'PROCESSING_ERROR_REASON_INVALID_EVENT',
          recordCount: 1
        }
      ],
      recordCount: 1
    },
    { errorCounts: [], recordCount: 2 }
  ]) {
    const outcome = await reconcileGoogleDataManagerStatusAttempt(
      claim,
      {
        now: clocks(),
        random: () => 0,
        retrieveStatus: async requestId => ({
          destinationStatuses: ['SUCCESS'],
          errorCounts: diagnostics.errorCounts,
          overallStatus: 'SUCCESS',
          recordCount: diagnostics.recordCount,
          requestId,
          response: {},
          warningCounts: []
        })
      }
    )

    assert.equal(outcome.status, 'processing_failure')
  }
})
