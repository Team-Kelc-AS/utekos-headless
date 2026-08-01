import assert from 'node:assert/strict'
import test from 'node:test'
import {
  fetchMetaDatasetQuality,
  readMetaDatasetQualityConfig,
  type MetaDatasetQualityFetch
} from './fetchMetaDatasetQuality'

const qualityResponse = {
  web: [
    {
      data_freshness: {
        upload_frequency: 'real_time'
      },
      dedupe_key_feedback: [
        {
          dedupe_key: 'event_id',
          server_events_with_dedupe_key: { percentage: 100 }
        }
      ],
      event_coverage: {
        goal_percentage: 75,
        percentage: 100
      },
      event_match_quality: {
        composite_score: 9.3,
        match_key_feedback: [
          {
            coverage: { percentage: 100 },
            identifier: 'external_id',
            potential_aly_acr_increase: { percentage: 148.2 }
          }
        ]
      },
      event_name: 'Purchase'
    }
  ]
}

test('reads the preferred Meta Dataset Quality environment values', () => {
  assert.deepEqual(
    readMetaDatasetQualityConfig({
      META_ACCESS_TOKEN: ' capi-token ',
      META_SYSTEM_USER_TOKEN: ' system-user-token ',
      META_PIXEL_ID: ' 123 '
    }),
    { accessToken: 'system-user-token', datasetId: '123' }
  )
})

test('falls back to the CAPI token for Dataset Quality reads', () => {
  assert.deepEqual(
    readMetaDatasetQualityConfig({
      META_ACCESS_TOKEN: ' capi-token ',
      NEXT_PUBLIC_META_PIXEL_ID: ' 123 '
    }),
    { accessToken: 'capi-token', datasetId: '123' }
  )
})

test('uses bearer authorization and validates the quality response', async () => {
  const calls: Array<{ init: RequestInit; url: URL }> = []
  const fetchImplementation: MetaDatasetQualityFetch = async (
    input,
    init
  ) => {
    calls.push({ init, url: new URL(input) })
    return {
      json: async () => qualityResponse,
      ok: true,
      status: 200
    }
  }

  const result = await fetchMetaDatasetQuality(
    { accessToken: 'secret-token', datasetId: '123' },
    fetchImplementation
  )

  assert.equal(result.web[0]?.event_name, 'Purchase')
  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.url.pathname, '/v25.0/dataset_quality')
  assert.equal(calls[0]?.url.searchParams.get('dataset_id'), '123')
  assert.equal(calls[0]?.url.searchParams.has('access_token'), false)
  assert.match(
    calls[0]?.url.searchParams.get('fields') ?? '',
    /dedupe_key_feedback/
  )
  assert.deepEqual(calls[0]?.init.headers, {
    accept: 'application/json',
    authorization: 'Bearer secret-token'
  })
})

test('rejects malformed provider data', async () => {
  const fetchImplementation: MetaDatasetQualityFetch = async () => ({
    json: async () => ({ web: [{ event_name: '', event_match_quality: {} }] }),
    ok: true,
    status: 200
  })

  await assert.rejects(
    fetchMetaDatasetQuality(
      { accessToken: 'secret-token', datasetId: '123' },
      fetchImplementation
    )
  )
})
