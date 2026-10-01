import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildMetaEventMetrics,
  renderMetaStatsMarkdown,
  type MetaStatsReport
} from '@/lib/meta-insights/metaStatsReport'

test('buildMetaEventMetrics totals events and reports age from the newest active hour', () => {
  const metrics = buildMetaEventMetrics(
    [
      {
        data: [
          { value: 'PageView', count: '8' },
          { value: 'ViewContent', count: '2' }
        ]
      }
    ],
    [
      {
        start_time: '2026-10-01T01:00:00+0000',
        data: [{ value: 'PageView', count: 3 }]
      },
      {
        start_time: '2026-10-01T02:00:00+0000',
        data: [{ value: 'PageView', count: 5 }]
      }
    ],
    new Date('2026-10-01T02:37:00Z')
  )

  assert.deepEqual(metrics, [
    {
      event_name: 'PageView',
      count: 8,
      last_event_at: '2026-10-01T02:00:00.000Z',
      minutes_since_last_event: 37
    },
    {
      event_name: 'ViewContent',
      count: 2,
      last_event_at: null,
      minutes_since_last_event: null
    }
  ])
})

test('buildMetaEventMetrics does not sum cumulative event_total_counts cursor pages', () => {
  const metrics = buildMetaEventMetrics(
    [
      {
        start_time: '2026-10-01T00:00:00+0000',
        data: [{ value: 'PageView', count: 8 }]
      },
      {
        start_time: '2026-10-01T01:00:00+0000',
        data: [{ value: 'PageView', count: 6 }]
      }
    ],
    [],
    new Date('2026-10-01T02:00:00Z')
  )

  assert.equal(metrics[0]?.count, 8)
})

test('renderMetaStatsMarkdown retains quality and hourly coverage in readable tables', () => {
  const report: MetaStatsReport = {
    time_range: {
      start: '2026-10-01T00:00:00Z',
      end: '2026-10-01T06:00:00Z'
    },
    generated_at: '2026-10-01T06:10:00.000Z',
    total_event_count: 8,
    event_counts: [
      {
        event_name: 'PageView',
        count: 8,
        last_event_at: '2026-10-01T02:00:00.000Z',
        minutes_since_last_event: 250
      }
    ],
    deduplication_and_coverage: [
      {
        start_time: '2026-10-01T02:00:00+0000',
        data: [{ event: 'PageView' }]
      }
    ],
    current_emq_and_freshness: [
      {
        event_name: 'PageView',
        event_match_quality: {
          composite_score: 7.2,
          match_key_feedback: [
            {
              identifier: 'email',
              coverage: { percentage: 85 },
              potential_aly_acr_increase: { percentage: 12 }
            }
          ],
          diagnostics: [{ name: 'example' }]
        },
        event_coverage: { percentage: 99 },
        data_freshness: { upload_frequency: 'real_time' },
        dedupe_key_feedback: [
          {
            dedupe_key: 'event_id',
            browser_events_with_dedupe_key: { percentage: 100 },
            server_events_with_dedupe_key: { percentage: 95 },
            overall_browser_coverage_from_dedupe_key: {
              percentage: 94
            }
          }
        ]
      }
    ]
  }

  const markdown = renderMetaStatsMarkdown(report)
  assert.match(
    markdown,
    /\| Event \| Antall \| Siste aktive timebøtte \(UTC\) \| Minutter siden/
  )
  assert.match(
    markdown,
    /\| PageView \| 8 \| 2026-10-01T02:00:00.000Z \| 250 \|/
  )
  assert.match(markdown, /Event-behandling per time/)
  assert.match(
    markdown,
    /\| PageView \| 7\.2 \| \{"percentage":99\} \| \{"upload_frequency":"real_time"\} \|/
  )
  assert.match(markdown, /\| PageView \| email \| 85% \| 12% \|/)
  assert.match(
    markdown,
    /\| PageView \| event_id \| 100% \| 95% \| 94% \|/
  )
  assert.match(
    markdown,
    /\| PageView \| \[\{"name":"example"\}\] \|/
  )
})
