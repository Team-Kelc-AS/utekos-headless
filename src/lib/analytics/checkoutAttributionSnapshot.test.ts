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
        sc_cookie1: 'snap-cookie-1',
        uet_session: 'uet-session-1',
        uet_visitor: 'uet-visitor-1',
        unrelated: 'drop-me'
      },
      click_id: {
        epik: 'pinterest-click',
        fbclid: 'meta-click',
        gclid: 'google-click',
        sc_click_id: 'snap-click',
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
      ga_client_id: '123456789.1784194900',
      sc_cookie1: 'snap-cookie-1',
      uet_session: 'uet-session-1',
      uet_visitor: 'uet-visitor-1'
    },
    click_id: {
      epik: 'pinterest-click',
      fbclid: 'meta-click',
      gclid: 'google-click',
      sc_click_id: 'snap-click'
    },
    external_id: 'anon_550e8400-e29b-41d4-a716-446655440000',
    page_url: 'https://utekos.no/produkter/test',
    referrer_url: 'https://facebook.com/ad'
  })
})

test('round-trips a PII-free experiment only with analytics consent', () => {
  const experiment = {
    key: 'skreddersy-varmen-layout-v1',
    variant: 'legacy'
  }
  const granted = createCheckoutAttributionSnapshot(
    {
      consent: {
        analytics: 'granted',
        marketing: 'denied',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      experiment
    },
    capturedAt
  )
  const grantedAttributes =
    checkoutAttributionSnapshotToShopifyAttributes(granted).map(
      attribute => ({
        name: attribute.key,
        value: attribute.value
      })
    )

  assert.deepEqual(
    parseOrderAttributionFromNoteAttributes(grantedAttributes)
      .experiment,
    experiment
  )

  const denied = createCheckoutAttributionSnapshot(
    {
      consent: {
        analytics: 'denied',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      experiment
    },
    capturedAt
  )

  assert.equal(denied.experiment, undefined)
  assert.equal(
    checkoutAttributionSnapshotToShopifyAttributes(denied).some(
      attribute => attribute.key.startsWith('utekos_experiment_')
    ),
    false
  )
})

test('round-trips Facebook Login match signals only with marketing consent', () => {
  const snapshot = createCheckoutAttributionSnapshot(
    {
      consent: {
        analytics: 'denied',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      user_data: {
        email_sha256: ['a'.repeat(64)],
        facebook_login_id: '1234567890',
        phone_sha256: ['b'.repeat(64)]
      }
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

  assert.deepEqual(
    parseOrderAttributionFromNoteAttributes(noteAttributes)
      .user_data,
    snapshot.user_data
  )

  const denied = createCheckoutAttributionSnapshot(
    {
      consent: {
        analytics: 'granted',
        marketing: 'denied',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      user_data: snapshot.user_data
    },
    capturedAt
  )
  assert.equal(denied.user_data, undefined)
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

test('round-trips consented campaign hierarchy through Shopify attributes', () => {
  const snapshot = createCheckoutAttributionSnapshot(
    {
      campaign: {
        campaign_id: '1201',
        campaign_name: 'Comfyrobe Sales',
        adset_id: '1202',
        adset_name: 'Prospektering',
        ad_id: '1203',
        ad_name: 'Video A'
      },
      consent: {
        analytics: 'denied',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      }
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

  assert.deepEqual(
    noteAttributes.filter(
      attribute =>
        attribute.name.startsWith('utekos_') &&
        (attribute.name.includes('campaign') ||
          attribute.name.includes('adset') ||
          attribute.name.includes('ad_'))
    ),
    [
      { name: 'utekos_campaign_id', value: '1201' },
      { name: 'utekos_campaign_name', value: 'Comfyrobe Sales' },
      { name: 'utekos_adset_id', value: '1202' },
      { name: 'utekos_adset_name', value: 'Prospektering' },
      { name: 'utekos_ad_id', value: '1203' },
      { name: 'utekos_ad_name', value: 'Video A' }
    ]
  )
  assert.deepEqual(
    parseOrderAttributionFromNoteAttributes(noteAttributes)
      .campaign,
    snapshot.campaign
  )
})

test('drops campaign hierarchy without marketing consent', () => {
  const snapshot = createCheckoutAttributionSnapshot(
    {
      campaign: {
        campaign_id: 'should-not-persist',
        adset_id: 'should-not-persist',
        ad_id: 'should-not-persist'
      },
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

  assert.equal(snapshot.campaign, undefined)
  assert.equal(
    checkoutAttributionSnapshotToShopifyAttributes(
      snapshot
    ).some(
      attribute =>
        attribute.key.startsWith('utekos_campaign') ||
        attribute.key.startsWith('utekos_adset') ||
        attribute.key.startsWith('utekos_ad_')
    ),
    false
  )
})

test('keeps valid campaign fields when an external order field is malformed', () => {
  const parsed = parseOrderAttributionFromNoteAttributes([
    {
      name: 'utekos_consent',
      value: JSON.stringify({
        analytics: 'denied',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      })
    },
    { name: 'utekos_campaign_id', value: '1201' },
    { name: 'utekos_ad_name', value: 'a'.repeat(501) }
  ])

  assert.deepEqual(parsed.campaign, { campaign_id: '1201' })
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
    {
      name: 'utekos_page_url',
      value: 'https://utekos.no/private'
    },
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
