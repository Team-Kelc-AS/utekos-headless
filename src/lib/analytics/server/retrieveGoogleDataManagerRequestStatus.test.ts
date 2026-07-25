import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoogleDataManagerIngestionClient } from './createGoogleDataManagerIngestionClient'
import { retrieveGoogleDataManagerRequestStatus } from './retrieveGoogleDataManagerRequestStatus'

function client(
  requestStatus: string
): GoogleDataManagerIngestionClient {
  return {
    ingestEvents: async () => [{}],
    retrieveRequestStatus: async () => [
      {
        requestStatusPerDestination: [
          {
            destination: {
              loginAccount: {
                accountId: '489598217',
                accountType: 'GOOGLE_ANALYTICS_PROPERTY' as never
              },
              productDestinationId: 'G-FCES3L0M9M'
            },
            requestStatus: requestStatus as never,
            eventsIngestionStatus: { recordCount: 1 }
          }
        ]
      }
    ]
  }
}

test('normalizes a provider-confirmed success', async () => {
  const result = await retrieveGoogleDataManagerRequestStatus(
    ' request-1 ',
    { createClient: () => client('SUCCESS') }
  )

  assert.equal(result.requestId, 'request-1')
  assert.equal(result.overallStatus, 'SUCCESS')
  assert.deepEqual(result.destinationStatuses, ['SUCCESS'])
  assert.equal(result.recordCount, 1)
  assert.deepEqual(result.errorCounts, [])
  assert.deepEqual(result.warningCounts, [])
  assert.deepEqual(result.response.requestStatusPerDestination, [
    {
      destination: {
        loginAccount: {
          accountId: '489598217',
          accountType: 'GOOGLE_ANALYTICS_PROPERTY'
        },
        productDestinationId: 'G-FCES3L0M9M'
      },
      requestStatus: 'SUCCESS',
      eventsIngestionStatus: { recordCount: '1' }
    }
  ])
})

test('extracts event record count, errorInfo, and warningInfo', async () => {
  const result = await retrieveGoogleDataManagerRequestStatus(
    'request-with-diagnostics',
    {
      createClient: () => ({
        ingestEvents: async () => [{}],
        retrieveRequestStatus: async () => [
          {
            requestStatusPerDestination: [
              {
                requestStatus: 'SUCCESS' as never,
                eventsIngestionStatus: { recordCount: 1 },
                errorInfo: {
                  errorCounts: [
                    {
                      reason:
                        'PROCESSING_ERROR_REASON_INVALID_EVENT' as never,
                      recordCount: 1
                    }
                  ]
                },
                warningInfo: {
                  warningCounts: [
                    {
                      reason:
                        'PROCESSING_WARNING_REASON_INTERNAL_ERROR' as never,
                      recordCount: 2
                    }
                  ]
                }
              }
            ]
          }
        ]
      })
    }
  )

  assert.equal(result.recordCount, 1)
  assert.deepEqual(result.errorCounts, [
    {
      reason: 'PROCESSING_ERROR_REASON_INVALID_EVENT',
      recordCount: 1
    }
  ])
  assert.deepEqual(result.warningCounts, [
    {
      reason: 'PROCESSING_WARNING_REASON_INTERNAL_ERROR',
      recordCount: 2
    }
  ])
})

test('keeps processing and unknown responses retryable', async () => {
  for (const [input, expected] of [
    ['PROCESSING', 'PROCESSING'],
    ['NOT_A_STATUS', 'REQUEST_STATUS_UNKNOWN']
  ] as const) {
    const result = await retrieveGoogleDataManagerRequestStatus(
      'request-2',
      { createClient: () => client(input) }
    )

    assert.equal(result.overallStatus, expected)
  }
})

test('requires a request ID', async () => {
  await assert.rejects(
    retrieveGoogleDataManagerRequestStatus(' ', {
      createClient: () => client('SUCCESS')
    }),
    /requestId is required/
  )
})
