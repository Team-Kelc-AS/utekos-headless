import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalPageView } from '../pageViewEvent'
import { normalizeCanonicalPageView } from './normalizeCanonicalPageView'

const grantedConsent = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
} as const

function pageViewPayload(): CanonicalPageView {
  return {
    schema_version: 1,
    event_name: 'page_view',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
    event_time: '2026-07-15T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/produkter',
    page_title: 'Produkter',
    consent: grantedConsent,
    click_id: { fbclid: 'click-1', msclkid: 'click-2' },
    browser_id: { fbp: 'fb.1.1.test' },
    external_id: 'customer-1',
    impression_id: 'impression-1',
    client_ip_address: '198.51.100.99',
    user_data: {
      email_sha256: [
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      ]
    },
    event_device_info: {
      language: 'nb-NO',
      user_agent: 'spoofed-browser-agent',
      viewport_width: 1440
    },
    region_code: 'spoofed-region',
    location: {
      city: 'Spoofed City',
      country_code: 'SE',
      source: 'browser_permission'
    }
  }
}

test('rejects a payload outside the canonical page_view contract', () => {
  assert.throws(() =>
    normalizeCanonicalPageView(
      { event_name: 'page_view' },
      {}
    )
  )
})

test('uses trusted request context for server-owned fields', () => {
  const event = normalizeCanonicalPageView(pageViewPayload(), {
    city: 'Oslo',
    clientIpAddress: '203.0.113.10',
    countryCode: 'NO',
    postalCode: '0150',
    regionCode: '03',
    userAgent: 'trusted-browser-agent'
  })

  assert.equal(event.client_ip_address, '203.0.113.10')
  assert.equal(event.event_device_info?.user_agent, 'trusted-browser-agent')
  assert.equal(event.event_device_info?.viewport_width, 1440)
  assert.equal(event.region_code, '03')
  assert.deepEqual(event.location, {
    city: 'Oslo',
    country_code: 'NO',
    postal_code: '0150',
    region_code: '03',
    source: 'ip_geolocation'
  })
})

test('removes marketing identifiers when marketing consent is denied', () => {
  const payload = pageViewPayload()
  payload.consent = {
    ...grantedConsent,
    marketing: 'denied'
  }

  const event = normalizeCanonicalPageView(payload, {
    clientIpAddress: '203.0.113.10',
    userAgent: 'trusted-browser-agent'
  })

  assert.equal(event.click_id, undefined)
  assert.equal(event.browser_id, undefined)
  assert.equal(event.external_id, undefined)
  assert.equal(event.impression_id, undefined)
  assert.equal(event.client_ip_address, undefined)
  assert.equal(event.user_data, undefined)
  assert.equal(event.event_device_info?.user_agent, 'trusted-browser-agent')
})

test('keeps consented browser_permission location when preferences are granted', () => {
  const payload = pageViewPayload()
  payload.consent = {
    ...grantedConsent,
    preferences: 'granted'
  }
  payload.location = {
    city: 'Bergen',
    country_code: 'NO',
    postal_code: '5003',
    region_code: '46',
    source: 'browser_permission'
  }

  const event = normalizeCanonicalPageView(payload, {
    clientIpAddress: '203.0.113.10',
    userAgent: 'trusted-browser-agent'
  })

  assert.equal(event.client_ip_address, '203.0.113.10')
  assert.equal(event.event_device_info?.user_agent, 'trusted-browser-agent')
  assert.equal(event.region_code, undefined)
  assert.deepEqual(event.location, {
    city: 'Bergen',
    country_code: 'NO',
    postal_code: '5003',
    region_code: '46',
    source: 'browser_permission'
  })
})

test('rejects client-spoofed IP, user agent and non-permission location', () => {
  const event = normalizeCanonicalPageView(pageViewPayload(), {
    clientIpAddress: '203.0.113.10',
    userAgent: 'trusted-browser-agent'
  })

  assert.notEqual(event.client_ip_address, '198.51.100.99')
  assert.notEqual(event.event_device_info?.user_agent, 'spoofed-browser-agent')
  assert.notEqual(event.region_code, 'spoofed-region')
  assert.equal(event.location, undefined)
})
