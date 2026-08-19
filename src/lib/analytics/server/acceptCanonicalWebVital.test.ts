import assert from 'node:assert/strict'
import test from 'node:test'
import { acceptCanonicalWebVital } from './acceptCanonicalWebVital'
import type { CanonicalWebVitalStore } from './createPostgresWebVitalsStore'
import { mapCanonicalWebVitalToRow } from './mapCanonicalWebVitalToRow'
import { buildWebVitalCustomData, createCanonicalWebVital } from '../webVitalEvent'

function webVitalEvent(analytics: 'denied' | 'granted') {
  return createCanonicalWebVital({
    environment: 'test',
    eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    eventTime: '2026-08-19T10:00:00.000Z',
    pageUrl: 'https://utekos.no/',
    pageTitle: 'Utekos',
    pageViewId: 'e58460a4-5a60-450c-962a-7f22254c25dd',
    consent: {
      analytics,
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    customData: buildWebVitalCustomData({
      delta: 2800,
      entries: [],
      metricId: 'v4-lcp',
      name: 'LCP',
      pathname: '/',
      rating: 'needs-improvement',
      value: 2800
    })
  })
}

test('rejects analytics-denied events without calling storage', async () => {
  let calls = 0
  const store: CanonicalWebVitalStore = {
    insert: async () => {
      calls += 1
    }
  }

  const result = await acceptCanonicalWebVital({
    payload: webVitalEvent('denied'),
    requestContext: {},
    store
  })

  assert.deepEqual(result, {
    reason: 'consent_denied',
    status: 'rejected'
  })
  assert.equal(calls, 0)
})

test('inserts ops.web_vitals fields when analytics consent is granted', async () => {
  const writes: Parameters<CanonicalWebVitalStore['insert']>[0][] = []
  const store: CanonicalWebVitalStore = {
    insert: async row => {
      writes.push(row)
    }
  }
  const event = webVitalEvent('granted')

  const result = await acceptCanonicalWebVital({
    payload: event,
    requestContext: {},
    store
  })

  assert.deepEqual(result, {
    event_id: event.event_id,
    status: 'accepted'
  })
  assert.equal(writes.length, 1)
  assert.deepEqual(writes[0], mapCanonicalWebVitalToRow(event))
  assert.equal(writes[0]?.metric_id, 'v4-lcp')
  assert.equal(writes[0]?.name, 'LCP')
  assert.equal(writes[0]?.pathname, '/')
  assert.equal(writes[0]?.href, 'https://utekos.no/')
})

test('marketing consent alone is not enough to accept RUM', async () => {
  let calls = 0
  const store: CanonicalWebVitalStore = {
    insert: async () => {
      calls += 1
    }
  }

  const result = await acceptCanonicalWebVital({
    payload: webVitalEvent('denied'),
    requestContext: {},
    store
  })

  assert.equal(result.status, 'rejected')
  assert.equal(calls, 0)
})
