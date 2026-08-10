import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalPageViewSchema } from '../pageViewEvent'
import {
  buildMicrosoftUetCapiPageViewRequest,
  mapCanonicalPageViewToMicrosoftUet
} from './mapCanonicalPageViewToMicrosoftUet'

function pageView(overrides: Record<string, unknown> = {}) {
  return canonicalPageViewSchema.parse({
    schema_version: 1,
    event_name: 'page_view',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_view_id: '71c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_time: '2026-08-10T10:05:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/produkter/utekos-dun',
    referrer_url: 'https://utekos.no/produkter',
    page_title: 'Utekos Dun',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    external_id:
      'anon_550e8400-e29b-41d4-a716-446655440000',
    ...overrides
  })
}

test('maps every canonical navigation to a CAPI pageLoad event', () => {
  const event = mapCanonicalPageViewToMicrosoftUet(pageView())

  assert.equal(event.eventType, 'pageLoad')
  assert.equal(event.eventName, 'page_view')
  assert.equal(event.eventId, '61c2ef59-6e6f-4f56-a63a-567ca398f9de')
  assert.equal(
    event.pageLoadId,
    '71c2ef59-6e6f-4f56-a63a-567ca398f9de'
  )
  assert.equal(
    event.userData.anonymousId,
    '550e8400-e29b-41d4-a716-446655440000'
  )
  assert.equal(event.pageTitle, 'Utekos Dun')
  assert.equal(event.referrerUrl, 'https://utekos.no/produkter')
})

test('builds the documented pageLoad request envelope', () => {
  const request = buildMicrosoftUetCapiPageViewRequest(pageView())

  assert.equal(request.continueOnValidationError, false)
  assert.equal(request.dataProvider, 'utekos-headless')
  assert.equal(request.data[0]?.eventType, 'pageLoad')
})

test('rejects pageLoad mapping without marketing consent', () => {
  assert.throws(
    () =>
      mapCanonicalPageViewToMicrosoftUet(
        pageView({
          consent: {
            analytics: 'granted',
            marketing: 'denied',
            preferences: 'denied',
            source: 'cookiebot',
            version: '1'
          }
        })
      ),
    /marketing consent/
  )
})
