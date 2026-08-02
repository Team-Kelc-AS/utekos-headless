import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPageViewDataLayerEvent,
  createCanonicalPageView,
  resolvePageViewNavigation
} from './pageViewEvent'

const consent = {
  analytics: 'denied' as const,
  marketing: 'denied' as const,
  preferences: 'denied' as const,
  source: 'cookiebot' as const,
  version: '1'
}

test('builds a versioned canonical page_view with event_time and page context', () => {
  const event = createCanonicalPageView({
    environment: 'preview',
    eventId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    edgeRequestId: '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    eventTime: '2026-07-15T12:34:56.789Z',
    pageUrl: 'https://utekos.no/produkter?variant=123',
    referrerUrl: 'https://utekos.no/produkter',
    pageTitle: 'Produkter | Utekos',
    consent,
    eventDeviceInfo: {
      language: 'nb-NO',
      viewportHeight: 844,
      viewportWidth: 390
    }
  })

  assert.equal(event.schema_version, 1)
  assert.equal(event.event_name, 'page_view')
  assert.equal(
    event.edge_request_id,
    '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd'
  )
  assert.equal(event.event_time, '2026-07-15T12:34:56.789Z')
  assert.equal(event.source, 'web')
  assert.equal(event.referrer_url, 'https://utekos.no/produkter')
  assert.deepEqual(event.consent, consent)
  assert.equal(event.event_device_info?.viewport_width, 390)
})

test('rejects malformed canonical page_view input', () => {
  assert.throws(
    () => createCanonicalPageView({
      environment: 'production',
      eventId: 'not-a-uuid',
      pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
      eventTime: 'yesterday',
      pageUrl: '/relative',
      pageTitle: 'Utekos',
      consent
    }),
    /Invalid/
  )
})

test('maps the canonical event to the existing GTM page_view contract', () => {
  const event = createCanonicalPageView({
    environment: 'production',
    eventId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    eventTime: '2026-07-15T12:34:56.789Z',
    pageUrl: 'https://utekos.no/',
    pageTitle: 'Utekos',
    consent
  })

  const dataLayerEvent = buildPageViewDataLayerEvent(event)

  assert.equal(dataLayerEvent.event, 'page_view')
  assert.equal(dataLayerEvent.event_id, event.event_id)
  assert.equal(dataLayerEvent.page_location, event.page_url)
  assert.equal(dataLayerEvent.canonical_event, event)
})

test('keeps consented browser and URL identifiers in provider-neutral maps', () => {
  const event = createCanonicalPageView({
    environment: 'production',
    eventId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    eventTime: '2026-07-15T12:34:56.789Z',
    pageUrl: 'https://utekos.no/?gclid=google-1',
    pageTitle: 'Utekos',
    consent,
    browserId: { fbp: 'fb.1.123' },
    clickId: { gclid: 'google-1' },
    impressionId: 'impression-1'
  })

  assert.deepEqual(event.browser_id, { fbp: 'fb.1.123' })
  assert.deepEqual(event.click_id, { gclid: 'google-1' })
  assert.equal(event.impression_id, 'impression-1')
})

test('uses document referrer for the first page and previous URL for SPA navigation', () => {
  const initial = resolvePageViewNavigation({
    currentUrl: 'https://utekos.no/produkter',
    documentReferrer: 'https://www.google.com/',
    previousUrl: null
  })
  const navigation = resolvePageViewNavigation({
    currentUrl: 'https://utekos.no/produkter/utekos-techdown',
    documentReferrer: 'https://www.google.com/',
    previousUrl: 'https://utekos.no/produkter'
  })

  assert.equal(initial?.referrerUrl, 'https://www.google.com/')
  assert.equal(navigation?.referrerUrl, 'https://utekos.no/produkter')
})

test('deduplicates the same canonical URL', () => {
  assert.equal(resolvePageViewNavigation({
    currentUrl: 'https://utekos.no/produkter',
    documentReferrer: '',
    previousUrl: 'https://utekos.no/produkter'
  }), null)
})

test('deduplicates query-state changes on the same page resource', () => {
  assert.equal(resolvePageViewNavigation({
    currentUrl:
      'https://utekos.no/produkter/utekos-techdown?fbclid=click-1&farge=havdyp&storrelse=middels',
    documentReferrer: '',
    previousUrl:
      'https://utekos.no/produkter/utekos-techdown?fbclid=click-1'
  }), null)
})

test('keeps the full URL for an initial paid landing', () => {
  assert.deepEqual(resolvePageViewNavigation({
    currentUrl:
      'https://utekos.no/produkter/utekos-techdown?fbclid=click-1',
    documentReferrer: '',
    previousUrl: null
  }), {
    pageUrl:
      'https://utekos.no/produkter/utekos-techdown?fbclid=click-1'
  })
})
