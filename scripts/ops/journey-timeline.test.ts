import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatJourneyTimeline,
  JOURNEY_TIMELINE_QUERY,
  parseJourneyTimelineArguments
} from './journey-timeline'

test('report binds a UUID and bounded limit, and labels last observation without claiming exit', () => {
  assert.throws(() =>
    parseJourneyTimelineArguments(['--journey', 'invalid'])
  )
  assert.throws(() =>
    parseJourneyTimelineArguments([
      '--journey',
      '11111111-1111-4111-8111-111111111111',
      '--limit',
      '50000'
    ])
  )
  assert.equal(
    parseJourneyTimelineArguments([
      '--journey',
      '11111111-1111-4111-8111-111111111111'
    ]).limit,
    500
  )
  const rows = formatJourneyTimeline([
    {
      event_name: 'journey_progress',
      page_path:
        'https://utekos.no/produkter/utekos-dun?fbclid=private',
      evidence: 'browser_reported'
    }
  ])
  assert.equal(rows[0]?.page_path, '/produkter/utekos-dun')
  assert.equal(
    rows[0]?.observation_semantics,
    'last_observed_not_proven_exit'
  )
  assert.match(
    JOURNEY_TIMELINE_QUERY,
    /consent ->> 'analytics' = 'granted'/
  )
  assert.doesNotMatch(
    JOURNEY_TIMELINE_QUERY,
    /user_data|external_id|browser_id|source_object_id|transaction_id|client_ip_address/
  )
})
