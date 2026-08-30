import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalPageViewSchema } from '../pageViewEvent'
import { normalizeCanonicalBrowserEvent } from './normalizeCanonicalBrowserEvent'

const baseEvent = {
  schema_version: 1 as const,
  event_name: 'page_view' as const,
  event_id: '11111111-1111-4111-8111-111111111111',
  page_view_id: '22222222-2222-4222-8222-222222222222',
  journey_id: '33333333-3333-4333-8333-333333333333',
  previous_page_view_id: '44444444-4444-4444-8444-444444444444',
  event_time: '2026-08-29T12:00:00.000Z',
  source: 'web' as const,
  environment: 'test' as const,
  page_url: 'https://utekos.no/skreddersy-varmen',
  page_title: 'Skreddersy varmen',
  experiment: {
    key: 'skreddersy-varmen-layout-v1',
    variant: 'legacy'
  },
  consent: {
    analytics: 'granted' as const,
    marketing: 'denied' as const,
    preferences: 'denied' as const,
    source: 'cookiebot' as const,
    version: '1'
  }
}

test('retains internal journey context when analytics consent is granted', () => {
  const normalized = normalizeCanonicalBrowserEvent(
    canonicalPageViewSchema,
    baseEvent,
    {}
  )

  assert.equal(normalized.journey_id, baseEvent.journey_id)
  assert.equal(
    normalized.previous_page_view_id,
    baseEvent.previous_page_view_id
  )
  assert.deepEqual(normalized.experiment, baseEvent.experiment)
})

test('strips internal journey context when analytics consent is denied', () => {
  const normalized = normalizeCanonicalBrowserEvent(
    canonicalPageViewSchema,
    {
      ...baseEvent,
      consent: { ...baseEvent.consent, analytics: 'denied' }
    },
    {}
  )

  assert.equal(normalized.journey_id, undefined)
  assert.equal(normalized.previous_page_view_id, undefined)
  assert.equal(normalized.experiment, undefined)
})
