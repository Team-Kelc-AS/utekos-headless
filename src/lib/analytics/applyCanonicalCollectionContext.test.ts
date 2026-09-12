import assert from 'node:assert/strict'
import test from 'node:test'
import { applyCanonicalCollectionContext } from './applyCanonicalCollectionContext'

const denied = {
  analytics: 'denied',
  marketing: 'denied',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
} as const
const source = {
  consent: {
    ...denied,
    analytics: 'granted',
    marketing: 'granted'
  } as
    | typeof denied
    | {
        analytics: 'granted'
        marketing: 'granted'
        preferences: 'denied'
        source: 'cookiebot'
        version: '1'
      },
  browser_id: {
    ga_client_id: '1.2',
    ga_session_id: '3',
    fbp: 'fb.1.2.3',
    fbc: 'fb.1.2.click'
  },
  click_id: { fbclid: 'click' },
  campaign: { utm_source: 'meta' },
  meta_audience: 'engaged_audience',
  journey_id: 'journey',
  previous_page_view_id: 'previous',
  edge_request_id: 'request',
  page_url: 'https://utekos.no/?fbclid=click',
  event_id: 'unchanged',
  event_time: 'unchanged'
}
test('statistics-only cannot inherit marketing fields from current context or an old event', () => {
  const event = applyCanonicalCollectionContext(source, {
    hasResponse: true,
    consent: { ...denied, analytics: 'granted' },
    analyticsBrowserId: source.browser_id
  })
  assert.deepEqual(event.browser_id, {
    ga_client_id: '1.2',
    ga_session_id: '3'
  })
  assert.equal(event.click_id, undefined)
  assert.equal(event.campaign, undefined)
  assert.equal(event.meta_audience, undefined)
  assert.equal(event.page_url, 'https://utekos.no/')
  assert.equal(event.edge_request_id, undefined)
  assert.equal(event.event_id, 'unchanged')
})
test('marketing-only preserves consented attribution but never analytics journey or GA IDs', () => {
  const event = applyCanonicalCollectionContext(source, {
    hasResponse: true,
    consent: { ...denied, marketing: 'granted' }
  })
  assert.deepEqual(event.browser_id, {
    fbp: 'fb.1.2.3',
    fbc: 'fb.1.2.click'
  })
  assert.equal(event.meta_audience, undefined)
  assert.equal(event.journey_id, undefined)
  assert.equal(event.previous_page_view_id, undefined)
  assert.equal(event.event_time, 'unchanged')
})
