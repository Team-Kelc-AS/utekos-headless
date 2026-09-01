import assert from 'node:assert/strict'
import test from 'node:test'
import {
  handleMetaAdDeliveryInsightsCron,
  type MetaAdDeliveryInsightsCronDependencies
} from './route'

const syncResult = {
  accountId: '772268237116474',
  accountTimezone: 'America/Los_Angeles',
  creativeDestinationCount: 12,
  creativeDestinationUpsertedCount: 12,
  fetchedAt: '2026-08-01T06:00:00.000Z',
  rowCount: 25,
  rowsByBreakdown: {
    device_platform: 5,
    impression_device: 5,
    overall: 5,
    platform_position: 5,
    publisher_platform: 5
  },
  since: '2026-07-24',
  unavailableMetrics: {
    clicks: 0,
    impressions: 0,
    landing_page_views: 2,
    link_clicks: 0,
    outbound_clicks: 1
  },
  until: '2026-07-30',
  upsertedCount: 25
}

function request(authorization?: string) {
  return new Request(
    'https://utekos.no/api/cron/meta-ad-delivery-insights',
    authorization ? { headers: { authorization } } : undefined
  )
}

function dependencies(
  overrides: Partial<MetaAdDeliveryInsightsCronDependencies> = {}
): MetaAdDeliveryInsightsCronDependencies {
  return {
    getCronSecret: () => 'correct-secret',
    sync: async () => syncResult,
    ...overrides
  }
}

test('rejects an unauthorized Meta delivery sync', async () => {
  let syncCount = 0
  const response = await handleMetaAdDeliveryInsightsCron(
    request('Bearer wrong-secret'),
    dependencies({
      sync: async () => {
        syncCount += 1
        return syncResult
      }
    })
  )

  assert.equal(response.status, 401)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(syncCount, 0)
})

test('runs the authorized Meta delivery sync', async () => {
  const response = await handleMetaAdDeliveryInsightsCron(
    request('Bearer correct-secret'),
    dependencies()
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), {
    ...syncResult,
    ok: true
  })
})

test('marks a failed sync as an error without replacing the failure', async () => {
  const expectedError = new Error('Meta returned 500')

  await assert.rejects(
    handleMetaAdDeliveryInsightsCron(
      request('Bearer correct-secret'),
      dependencies({
        sync: async () => {
          throw expectedError
        }
      })
    ),
    expectedError
  )
})
