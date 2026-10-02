import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildScrollDepthDataLayerEvent,
  canonicalScrollDepthCustomDataSchema,
  createCanonicalScrollDepth
} from '@/lib/analytics/scrollDepthEvent'

test('custom_data requires catalog thresholds 25/50/75/90', () => {
  assert.throws(() =>
    canonicalScrollDepthCustomDataSchema.parse({
      threshold: 30,
      percent_scrolled: 30,
      document_height: 2000
    })
  )
})

test('createCanonicalScrollDepth accepts threshold payload', () => {
  const event = createCanonicalScrollDepth({
    environment: 'production',
    eventId: '72b6c4d3-cf47-493b-844c-147e237fcf45',
    eventTime: '2026-07-24T00:00:00.000Z',
    pageUrl: 'https://utekos.no/',
    pageTitle: 'Utekos',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'granted',
      source: 'cookiebot',
      version: '1'
    },
    customData: {
      threshold: 75,
      percent_scrolled: 75,
      document_height: 3200
    }
  })

  assert.equal(event.event_name, 'scroll_depth')
  assert.equal(event.custom_data.threshold, 75)
  assert.equal(event.custom_data.percent_scrolled, 75)
  assert.equal(event.custom_data.document_height, 3200)

  const dataLayer = buildScrollDepthDataLayerEvent(event)
  assert.equal(dataLayer.event, 'scroll_depth')
  assert.equal(dataLayer.event_id, event.event_id)
  assert.equal(dataLayer.custom_data.threshold, 75)
})
