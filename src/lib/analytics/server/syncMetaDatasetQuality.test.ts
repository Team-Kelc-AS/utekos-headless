import assert from 'node:assert/strict'
import test from 'node:test'
import {
  syncMetaDatasetQuality,
  type MetaDatasetQualitySyncDependencies
} from './syncMetaDatasetQuality'
import { requiredMetaDatasetQualityEvents } from '../metaDatasetQualityRequiredEvents'

test('marks a snapshot complete when every required event is present and ignores extras', async () => {
  const measuredAt = new Date('2026-07-18T21:20:00.000Z')
  const insertedInputs: unknown[] = []
  const dependencies: MetaDatasetQualitySyncDependencies = {
    fetchQuality: async () => ({
      web: [
        ...requiredMetaDatasetQualityEvents.map(event_name => ({
          event_name
        })),
        { event_name: 'Search' }
      ]
    }),
    getConfig: () => ({
      accessToken: 'secret-token',
      datasetId: '1092362672918571'
    }),
    getNow: () => measuredAt,
    insertSnapshot: async input => {
      insertedInputs.push(input)
      return 7
    }
  }

  const result = await syncMetaDatasetQuality(dependencies)

  assert.deepEqual(result, {
    datasetId: '1092362672918571',
    eventCount: 19,
    insertedCount: 7,
    complete: true,
    missingRequiredEvents: [],
    measuredAt: '2026-07-18T21:20:00.000Z'
  })
  assert.equal(insertedInputs.length, 1)
})

test('reports Lead as missing without turning a successful sync into a failure', async () => {
  const dependencies: MetaDatasetQualitySyncDependencies = {
    fetchQuality: async () => ({
      web: requiredMetaDatasetQualityEvents
        .filter(eventName => eventName !== 'Lead')
        .map(event_name => ({ event_name }))
    }),
    getConfig: () => ({
      accessToken: 'secret-token',
      datasetId: '1092362672918571'
    }),
    getNow: () => new Date('2026-07-24T04:17:35.000Z'),
    insertSnapshot: async () => 5
  }

  const result = await syncMetaDatasetQuality(dependencies)

  assert.equal(result.complete, false)
  assert.deepEqual(result.missingRequiredEvents, ['Lead'])
  assert.equal(result.insertedCount, 5)
})
