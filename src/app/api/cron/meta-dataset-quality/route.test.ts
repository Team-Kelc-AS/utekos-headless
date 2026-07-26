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
    checkIn: async () => 'check-in-id',
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

  const checkIns: unknown[] = []
  cronDependencies.checkIn = async input => {
    checkIns.push(input)
    return 'check-in-id'
  }

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
  assert.deepEqual(checkIns, [
    { runKind: 'primary', status: 'in_progress' },
    {
      checkInId: 'check-in-id',
      runKind: 'primary',
      status: 'error'
    }
  ])
})

test('finishes a thrown auth evaluation as error without masking the original failure', async () => {
  const checkIns: unknown[] = []
  const expectedError = new Error('secret store unavailable')

  await assert.rejects(
    handleMetaDatasetQualityCron(
      request('Bearer correct-secret'),
      dependencies({
        checkIn: async input => {
          checkIns.push(input)
          if (checkIns.length === 2) {
            throw new Error('Sentry unavailable')
          }
          return 'check-in-id'
        },
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

  assert.deepEqual(checkIns, [
    { runKind: 'primary', status: 'in_progress' },
    {
      checkInId: 'check-in-id',
      runKind: 'primary',
      status: 'error'
    }
  ])
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

test('finishes a thrown sync as an error check-in without replacing the failure', async () => {
  const checkIns: unknown[] = []
  const expectedError = new Error('Meta returned 500')

  await assert.rejects(
    handleMetaDatasetQualityCron(
      request('Bearer correct-secret'),
      dependencies({
        checkIn: async input => {
          checkIns.push(input)
          return 'check-in-id'
        },
        sync: async () => {
          throw expectedError
        }
      })
    ),
    expectedError
  )

  assert.deepEqual(checkIns, [
    { runKind: 'primary', status: 'in_progress' },
    {
      checkInId: 'check-in-id',
      runKind: 'primary',
      status: 'error'
    }
  ])
})

test('keeps the successful response unchanged when check-in delivery fails', async () => {
  const response = await handleMetaDatasetQualityCron(
    request('Bearer correct-secret'),
    dependencies({
      checkIn: async () => {
        throw new Error('Sentry unavailable')
      }
    })
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    ...syncResult,
    ok: true,
    runKind: 'primary'
  })
})

test('logs one incomplete retry warning and still finishes the check-in as ok', async () => {
  const checkIns: unknown[] = []
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
      checkIn: async input => {
        checkIns.push(input)
        return 'check-in-id'
      },
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
  assert.deepEqual(checkIns, [
    { runKind: 'retry', status: 'in_progress' },
    {
      checkInId: 'check-in-id',
      runKind: 'retry',
      status: 'ok'
    }
  ])
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
