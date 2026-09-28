import assert from 'node:assert/strict'
import test from 'node:test'
import { createCanonicalPageView } from '@/lib/analytics/pageViewEvent'
import { enrichCanonicalEventWithMetaAttribution } from '@/lib/analytics/enrichCanonicalEventWithMetaAttribution'

test('accepts canonical click IDs and preserves the event subtype', async () => {
  const event = createCanonicalPageView({
    clickId: {
      fbclid: 'MetaCaseSensitiveValue',
      gclid: 'GoogleCaseSensitiveValue'
    },
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    environment: 'test',
    eventId: '11111111-1111-4111-8111-111111111111',
    eventTime: '2026-07-21T12:00:00.000Z',
    pageTitle: 'Utekos',
    pageUrl: 'https://utekos.no/',
    pageViewId: '22222222-2222-4222-8222-222222222222'
  })

  const enriched =
    await enrichCanonicalEventWithMetaAttribution(event)

  const preservedEventName: 'page_view' = enriched.event_name

  assert.equal(enriched, event)
  assert.equal(
    enriched.click_id?.fbclid,
    'MetaCaseSensitiveValue'
  )
  assert.equal(preservedEventName, 'page_view')
})
