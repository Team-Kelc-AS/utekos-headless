import assert from 'node:assert/strict'
import test from 'node:test'
import { handleMetaDatasetQualityRetryCron } from './route'

test('identifies the retry route independently from the primary route', async () => {
  const response = await handleMetaDatasetQualityRetryCron(
    new Request('https://utekos.no/api/cron/meta-dataset-quality-retry', {
      headers: { authorization: 'Bearer correct-secret' }
    }),
    {
      checkIn: async () => 'check-in-id',
      getCronSecret: () => 'correct-secret',
      log: async () => undefined,
      sync: async () => ({
        complete: true,
        datasetId: '1092362672918571',
        eventCount: 7,
        insertedCount: 7,
        measuredAt: '2026-07-24T04:17:35.000Z',
        missingRequiredEvents: []
      })
    }
  )

  assert.deepEqual(await response.json(), {
    complete: true,
    datasetId: '1092362672918571',
    eventCount: 7,
    insertedCount: 7,
    measuredAt: '2026-07-24T04:17:35.000Z',
    missingRequiredEvents: [],
    ok: true,
    runKind: 'retry'
  })
})
