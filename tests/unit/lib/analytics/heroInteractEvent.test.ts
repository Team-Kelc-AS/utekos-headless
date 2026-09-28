import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildHeroInteractDataLayerEvent,
  canonicalHeroInteractCustomDataSchema,
  createCanonicalHeroInteract
} from '@/lib/analytics/heroInteractEvent'

test('custom_data requires cta_id, destination_path, click_sequence', () => {
  assert.throws(() =>
    canonicalHeroInteractCustomDataSchema.parse({
      cta_id: 'read_more_hero',
      destination_path: '/skreddersy-varmen'
    })
  )
})

test('createCanonicalHeroInteract accepts hero CTA payload', () => {
  const event = createCanonicalHeroInteract({
    environment: 'production',
    eventId: '72b6c4d3-cf47-493b-844c-147e237fcf45',
    eventTime: '2026-07-24T00:00:00.000Z',
    pageUrl: 'https://utekos.no/',
    pageTitle: 'Utekos - Skreddersy varmen',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    customData: {
      cta_id: 'read_more_hero',
      destination_path: '/skreddersy-varmen',
      click_sequence: 1
    }
  })

  assert.equal(event.event_name, 'hero_interact')
  assert.equal(event.custom_data.cta_id, 'read_more_hero')
  assert.equal(event.custom_data.destination_path, '/skreddersy-varmen')
  assert.equal(event.custom_data.click_sequence, 1)
  assert.equal(event.page_url, 'https://utekos.no/')
  assert.equal(event.source, 'web')

  const dataLayer = buildHeroInteractDataLayerEvent(event)
  assert.equal(dataLayer.event, 'hero_interact')
  assert.equal(dataLayer.event_id, event.event_id)
  assert.equal(dataLayer.custom_data.cta_id, 'read_more_hero')
})
