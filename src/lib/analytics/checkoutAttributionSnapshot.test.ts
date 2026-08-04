import assert from 'node:assert/strict'
import test from 'node:test'
import {
  checkoutAttributionSnapshotToShopifyAttributes,
  createCheckoutAttributionSnapshot,
  parseOrderAttributionFromNoteAttributes
} from './checkoutAttributionSnapshot'

const capturedAt = '2026-07-18T12:00:00.000Z'

test('round-trips consented attribution through Shopify attributes', () => {
  const snapshot = createCheckoutAttributionSnapshot(
    {
      browser_id: {
        fbc: 'fb.1.1784195000000.meta-click',
        fbp: 'fb.1.1784194900000.123456789',
        ga_client_id: '123456789.1784194900',
        unrelated: 'drop-me'
      },
      click_id: {
        fbclid: 'meta-click',
        gclid: 'google-click',
        unknown: 'drop-me'
      },
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      external_id: 'anon_550e8400-e29b-41d4-a716-446655440000',
      page_url:
        'https://utekos.no/produkter/test?fbclid=meta-click#details',
      referrer_url: 'https://facebook.com/ad?campaign=secret'
    },
    capturedAt
  )
  const noteAttributes =
    checkoutAttributionSnapshotToShopifyAttributes(snapshot).map(
      attribute => ({
        name: attribute.key,
        value: attribute.value
      })
    )
  const parsed =
    parseOrderAttributionFromNoteAttributes(noteAttributes)

  assert.deepEqual(parsed, {
    schema_version: 1,
    captured_at: capturedAt,
    consent: snapshot.consent,
    browser_id: {
      fbc: 'fb.1.1784195000000.meta-click',
      fbp: 'fb.1.1784194900000.123456789',
      ga_client_id: '123456789.1784194900'
    },
    click_id: { fbclid: 'meta-click', gclid: 'google-click' },
    external_id: 'anon_550e8400-e29b-41d4-a716-446655440000',
    page_url: 'https://utekos.no/produkter/test',
    referrer_url: 'https://facebook.com/ad'
  })
})

test('persists only the consent decision after a full denial', () => {
  const snapshot = createCheckoutAttributionSnapshot(
    {
      browser_id: { fbp: 'should-not-persist' },
      click_id: { fbclid: 'should-not-persist' },
      consent: {
        analytics: 'denied',
        marketing: 'denied',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      external_id: 'should-not-persist',
      page_url: 'https://utekos.no/'
    },
    capturedAt
  )

  assert.deepEqual(
    checkoutAttributionSnapshotToShopifyAttributes(snapshot).map(
      attribute => attribute.key
    ),
    ['utekos_consent']
  )
})

test('adds a PII-free begin-checkout correlation only with analytics consent', () => {
  const eventId = '550e8400-e29b-41d4-a716-446655440000'
  const granted = createCheckoutAttributionSnapshot(
    {
      consent: {
        analytics: 'granted',
        marketing: 'denied',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      }
    },
    capturedAt
  )
  const denied = createCheckoutAttributionSnapshot(
    {
      consent: {
        analytics: 'denied',
        marketing: 'denied',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      }
    },
    capturedAt
  )

  assert.equal(
    checkoutAttributionSnapshotToShopifyAttributes(
      granted,
      eventId
    ).find(
      attribute =>
        attribute.key === 'utekos_begin_checkout_event_id'
    )?.value,
    eventId
  )
  assert.equal(
    checkoutAttributionSnapshotToShopifyAttributes(
      denied,
      eventId
    ).some(
      attribute =>
        attribute.key === 'utekos_begin_checkout_event_id'
    ),
    false
  )
})

test('drops malformed or non-consented external order attributes', () => {
  const parsed = parseOrderAttributionFromNoteAttributes([
    {
      name: 'utekos_consent',
      value: JSON.stringify({
        analytics: 'denied',
        marketing: 'denied',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      })
    },
    { name: 'utekos_attribution_captured_at', value: 'invalid' },
    { name: 'utekos_external_id', value: 'should-not-pass' },
    { name: 'utekos_page_url', value: 'https://utekos.no/private' },
    { name: '_fbc', value: 'should-not-pass' }
  ])

  assert.deepEqual(parsed, {
    schema_version: 1,
    captured_at: '1970-01-01T00:00:00.000Z',
    consent: {
      analytics: 'denied',
      marketing: 'denied',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    }
  })
})
