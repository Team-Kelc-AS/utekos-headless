import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildViewCategoryDataLayerEvent,
  canonicalViewCategoryCustomDataSchema,
  createCanonicalViewCategory
} from './viewCategoryEvent'

test('custom_data requires category_id, category_name, view_sequence', () => {
  assert.throws(() =>
    canonicalViewCategoryCustomDataSchema.parse({
      category_id: 'produkter',
      category_name: 'Kolleksjonen'
    })
  )
})

test('createCanonicalViewCategory accepts category payload', () => {
  const event = createCanonicalViewCategory({
    environment: 'production',
    eventId: '72b6c4d3-cf47-493b-844c-147e237fcf45',
    eventTime: '2026-07-24T00:00:00.000Z',
    pageUrl: 'https://utekos.no/produkter',
    pageTitle: 'Kolleksjonen for kompromissløs komfort | Utekos',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    customData: {
      category_id: 'produkter',
      category_name: 'Kolleksjonen',
      view_sequence: 1
    }
  })

  assert.equal(event.event_name, 'view_category')
  assert.equal(event.custom_data.category_id, 'produkter')
  assert.equal(event.custom_data.category_name, 'Kolleksjonen')
  assert.equal(event.custom_data.view_sequence, 1)
  assert.equal(event.page_url, 'https://utekos.no/produkter')
  assert.equal(event.source, 'web')

  const dataLayer = buildViewCategoryDataLayerEvent(event)
  assert.equal(dataLayer.event, 'view_category')
  assert.equal(dataLayer.event_id, event.event_id)
  assert.equal(dataLayer.custom_data.category_id, 'produkter')
})

test('createCanonicalViewCategory accepts catalog content_ids', () => {
  const event = createCanonicalViewCategory({
    environment: 'production',
    eventId: '72b6c4d3-cf47-493b-844c-147e237fcf45',
    eventTime: '2026-07-24T00:00:00.000Z',
    pageUrl: 'https://utekos.no/produkter',
    pageTitle: 'Kolleksjonen for kompromissløs komfort | Utekos',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    customData: {
      category_id: 'produkter',
      category_name: 'Kolleksjonen',
      view_sequence: 1,
      content_ids: ['48249962135800', '48249962135801']
    }
  })

  assert.deepEqual(event.custom_data.content_ids, [
    '48249962135800',
    '48249962135801'
  ])
})
