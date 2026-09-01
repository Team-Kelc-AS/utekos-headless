import assert from 'node:assert/strict'
import test from 'node:test'
import {
  handleMetaDatasetQualityCron,
  type MetaDatasetQualityCronDependencies
} from './route'
import type { MetaDatasetQualitySyncResult } from '../../../../lib/analytics/server/syncMetaDatasetQuality'

function request(authorization?: string) {
  return new Request(
    'https://utekos.no/api/cron/meta-dataset-quality',
    authorization ? { headers: { authorization } } : undefined
  )
}

const syncResult = {
  complete: true,
  datasetId: '1092362672918571',
  eventCount: 6,
  insertedCount: 6,
  missingRequiredEvents: [],
  measuredAt: '2026-07-18T21:20:00.000Z'
}

function dependencies(
  overrides: Partial<MetaDatasetQualityCronDependencies> = {}
): MetaDatasetQualityCronDependencies {
  return {
    getCronSecret: () => 'correct-secret',
    log: async () => undefined,
    sync: async () => syncResult,
    ...overrides
  }
}

test('rejects an unauthorized Meta quality cron', async () => {
  const cronDependencies = dependencies({
    getCronSecret: () => 'correct-secret',
    sync: async () => {
      throw new Error('sync must not run')
    }
  })

  const response = await handleMetaDatasetQualityCron(
    request('Bearer wrong-secret'),
    cronDependencies
  )

  assert.equal(response.status, 401)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), {
    ok: false,
    runKind: 'primary'
  })
})

test('does not mask a thrown auth evaluation', async () => {
  const expectedError = new Error('secret store unavailable')

  await assert.rejects(
    handleMetaDatasetQualityCron(
      request('Bearer correct-secret'),
      dependencies({
        getCronSecret: () => {
          throw expectedError
        },
        sync: async () => {
          throw new Error('sync must not run')
        }
      })
    ),
    expectedError
  )
})

test('runs the authorized Meta quality sync', async () => {
  let syncCount = 0
  const cronDependencies = dependencies({
    sync: async () => {
      syncCount += 1
      return syncResult
    }
  })

  const response = await handleMetaDatasetQualityCron(
    request('Bearer correct-secret'),
    cronDependencies
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(syncCount, 1)
  assert.deepEqual(await response.json(), {
    ...syncResult,
    ok: true,
    runKind: 'primary'
  })
})

test('does not replace a thrown sync failure', async () => {
  const expectedError = new Error('Meta returned 500')

  await assert.rejects(
    handleMetaDatasetQualityCron(
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

test('logs one incomplete retry warning', async () => {
  const logs: unknown[] = []
  const incompleteResult = {
    ...syncResult,
    complete: false,
    missingRequiredEvents: [
      'Lead'
    ] as MetaDatasetQualitySyncResult['missingRequiredEvents'],
    measuredAt: '2026-07-24T04:17:35.000Z'
  }

  const response = await handleMetaDatasetQualityCron(
    request('Bearer correct-secret'),
    dependencies({
      log: async input => {
        logs.push(input)
      },
      sync: async () => incompleteResult
    }),
    'retry'
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    ...incompleteResult,
    ok: true,
    runKind: 'retry'
  })
  assert.deepEqual(logs, [
    {
      context: {},
      data: {
        datasetId: '1092362672918571',
        missingRequiredEvents: ['Lead'],
        snapshotDate: '2026-07-24'
      },
      event: 'meta_dataset_quality.incomplete',
      level: 'WARN'
    }
  ])
})

test('does not warn for an incomplete primary run', async () => {
  const logs: unknown[] = []

  await handleMetaDatasetQualityCron(
    request('Bearer correct-secret'),
    dependencies({
      log: async input => {
        logs.push(input)
      },
      sync: async () => ({
        ...syncResult,
        complete: false,
        missingRequiredEvents: ['Lead']
      })
    })
  )

  assert.deepEqual(logs, [])
})
