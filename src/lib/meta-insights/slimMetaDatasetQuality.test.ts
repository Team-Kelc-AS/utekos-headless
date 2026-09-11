import assert from 'node:assert/strict'
import test from 'node:test'
import { slimMetaDatasetQuality } from './slimMetaDatasetQuality'

test('labels Dataset Quality metric windows and live-read persistence honestly', () => {
  const quality = slimMetaDatasetQuality({
    web: [
      {
        event_name: 'PageView',
        event_match_quality: {
          composite_score: 6.2,
          match_key_feedback: [
            { identifier: 'fbc', coverage: { percentage: 77 } }
          ]
        },
        event_coverage: {
          percentage: 74.1,
          goal_percentage: 75
        },
        dedupe_key_feedback: [
          {
            dedupe_key: 'event_id',
            browser_events_with_dedupe_key: { percentage: 100 },
            server_events_with_dedupe_key: { percentage: 100 },
            overall_browser_coverage_from_dedupe_key: {
              percentage: 74.1
            }
          }
        ],
        data_freshness: { upload_frequency: 'hourly' }
      },
      {
        event_name: 'Purchase',
        event_match_quality: { composite_score: 8 },
        acr: null
      }
    ]
  })

  assert.deepEqual(quality.retrieval, {
    source: 'meta_dataset_quality_api',
    mode: 'live_read_only',
    persistence: 'not_written'
  })
  assert.deepEqual(quality.semantics, {
    emq: 'calculated_in_real_time',
    coverage: 'rolling_7_day_average',
    freshness: 'average_provider_receipt_delay_category',
    acr: 'last_7_days_when_returned_by_provider'
  })

  const pageView = quality.events.find(
    event => event.eventName === 'PageView'
  )
  assert.equal(pageView?.providerStatus, 'returned')
  assert.equal(pageView?.emq, 6.2)
  assert.equal(pageView?.coverage, 74.1)
  assert.equal(pageView?.freshness, 'hourly')
  assert.deepEqual(pageView?.matchKeyCoverage, [
    { identifier: 'fbc', percentage: 77 }
  ])
  assert.deepEqual(pageView?.dedupeKeyCoverage, [
    {
      dedupeKey: 'event_id',
      browserWithKey: 100,
      serverWithKey: 100,
      deduplicatedBrowserCoverage: 74.1
    }
  ])

  const purchase = quality.events.find(
    event => event.eventName === 'Purchase'
  )
  assert.equal(purchase?.acr, null)
  assert.equal(purchase?.acrStatus, 'null_from_provider')

  const lead = quality.events.find(
    event => event.eventName === 'Lead'
  )
  assert.equal(lead?.providerStatus, 'not_returned')
  assert.equal(lead?.acrStatus, 'event_not_returned')
})
