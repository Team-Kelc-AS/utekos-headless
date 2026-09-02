import assert from 'node:assert/strict'
import test from 'node:test'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'
import {
  MetaNonWebEventTimeError,
  normalizeMetaNonWebIngestEvent
} from './normalizeMetaNonWebIngestEvent'

const now = new Date('2026-09-02T14:00:00.000Z')
const eventTime = Math.floor(
  Date.parse('2026-09-02T13:59:00.000Z') / 1000
)
const hash = 'a'.repeat(64)
const extinfo = [
  'i2',
  'no.utekos.app',
  '1.0',
  '100',
  '19.0',
  'iPhone17,1',
  'nb_NO',
  'CEST',
  '',
  1179,
  2556,
  '3',
  6,
  256,
  120,
  'Europe/Oslo'
] as const

function appPayload() {
  return {
    consent: {
      analytics: 'granted' as const,
      marketing: 'granted' as const,
      preferences: 'denied' as const,
      source: 'app' as const,
      version: 'app-consent-v1'
    },
    event: {
      advertiser_tracking_enabled: true,
      app_data: { application_tracking_enabled: true, extinfo },
      event_id: 'native-app-lead-1',
      event_name: 'Lead',
      event_time: eventTime,
      user_data: { external_id: 'observed-app-user-1' }
    },
    schema_version: 1 as const,
    source_type: 'app' as const
  }
}

function offlinePayload() {
  return {
    consent: {
      analytics: 'denied' as const,
      marketing: 'granted' as const,
      preferences: 'denied' as const,
      source: 'offline' as const,
      version: 'offline-consent-v1'
    },
    event: {
      custom_data: {
        content_ids: ['variant-1'],
        contents: [
          { id: 'variant-1', item_price: 1990, quantity: 1 }
        ],
        currency: 'NOK',
        order_id: 'pos-order-1',
        value: 1990
      },
      event_id: 'physical-store-purchase-1',
      event_name: 'Purchase',
      event_time: eventTime,
      user_data: { email_sha256: [hash] }
    },
    schema_version: 1 as const,
    source_type: 'offline' as const
  }
}

test('normalizes app events deterministically and routes only to Meta', () => {
  const first = normalizeMetaNonWebIngestEvent(appPayload(), {
    environment: 'test',
    now
  })
  const retry = normalizeMetaNonWebIngestEvent(appPayload(), {
    environment: 'test',
    now
  })

  assert.equal(first.event_name, 'meta_app_event')
  assert.equal(first.event_id, retry.event_id)
  assert.equal(first.event_time, '2026-09-02T13:59:00.000Z')
  assert.equal(first.consent.source, 'app')
  assert.equal(first.meta_event.event_id, 'native-app-lead-1')
  assert.deepEqual(planCanonicalEventDispatch(first), [
    {
      dispatch_mode: 'server_retry',
      event_id: first.event_id,
      provider: 'meta'
    }
  ])
})

test('normalizes physical-store purchases without relabeling them as web events', () => {
  const event = normalizeMetaNonWebIngestEvent(
    offlinePayload(),
    { environment: 'test', now }
  )

  assert.equal(event.event_name, 'meta_offline_event')
  assert.equal(event.consent.source, 'offline')
  assert.equal(
    event.meta_event.event_id,
    'physical-store-purchase-1'
  )
  assert.deepEqual(planCanonicalEventDispatch(event), [
    {
      dispatch_mode: 'server_retry',
      event_id: event.event_id,
      provider: 'meta'
    }
  ])
})

test('rejects denied marketing consent and mismatched source declarations', () => {
  assert.throws(() =>
    normalizeMetaNonWebIngestEvent(
      {
        ...appPayload(),
        consent: { ...appPayload().consent, marketing: 'denied' }
      },
      { now }
    )
  )

  assert.throws(() =>
    normalizeMetaNonWebIngestEvent(
      {
        ...appPayload(),
        consent: { ...appPayload().consent, source: 'offline' }
      },
      { now }
    )
  )
})

test('rejects events older than seven days or too far in the future', () => {
  const eightDaysAgo = Math.floor(
    (now.getTime() - 8 * 24 * 60 * 60 * 1000) / 1000
  )
  const tenMinutesAhead = Math.floor(
    (now.getTime() + 10 * 60 * 1000) / 1000
  )

  assert.throws(
    () =>
      normalizeMetaNonWebIngestEvent(
        {
          ...offlinePayload(),
          event: {
            ...offlinePayload().event,
            event_time: eightDaysAgo
          }
        },
        { now }
      ),
    MetaNonWebEventTimeError
  )
  assert.throws(
    () =>
      normalizeMetaNonWebIngestEvent(
        {
          ...appPayload(),
          event: {
            ...appPayload().event,
            event_time: tenMinutesAhead
          }
        },
        { now }
      ),
    MetaNonWebEventTimeError
  )
})
