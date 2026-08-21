import assert from 'node:assert/strict'
import test from 'node:test'
import {
  extractBrowserIds,
  extractClickIds,
  getConsentSnapshot
} from './pageViewClientContext'

test('maps missing Cookiebot state to conservative denied consent', () => {
  assert.deepEqual(getConsentSnapshot(undefined), {
    analytics: 'denied',
    marketing: 'denied',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  })
})

test('maps Cookiebot categories to the canonical consent snapshot', () => {
  assert.deepEqual(getConsentSnapshot({
    marketing: true,
    preferences: false,
    statistics: true
  }), {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  })
})

test('extracts supported click identifiers from the current URL', () => {
  assert.deepEqual(
    extractClickIds('https://utekos.no/?gclid=google-1&fbclid=meta-1&unknown=no'),
    { gclid: 'google-1', fbclid: 'meta-1' }
  )
})

test('extracts the Pinterest click id from its documented _epik cookie', () => {
  assert.deepEqual(
    extractClickIds(
      'https://utekos.no/produkter/comfyrobe',
      '_epik=pinterest-cookie-1; unrelated=value'
    ),
    { epik: 'pinterest-cookie-1' }
  )
})

test('does not expose browser identifiers without matching consent', () => {
  const cookie = '_fbp=fb.1.123; _fbc=fb.1.456; _ga=GA1.1.123.456'

  assert.equal(extractBrowserIds(cookie, {
    analytics: 'denied',
    marketing: 'denied',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  }), undefined)
})

test('reads only consented browser identifiers from existing cookies', () => {
  const cookie =
    '_fbp=fb.1.123; _fbc=fb.1.456; _ga=GA1.1.123.456; _uetsid=uet-session; _uetvid=uet-visitor'

  assert.deepEqual(extractBrowserIds(cookie, {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  }), {
    fbp: 'fb.1.123',
    fbc: 'fb.1.456',
    uet_session: 'uet-session',
    uet_visitor: 'uet-visitor',
    ga_client: 'GA1.1.123.456'
  })
})
