import assert from 'node:assert/strict'
import test from 'node:test'
import { ensureCanonicalMetaBrowserIds } from './ensureCanonicalMetaBrowserIds'

const marketingConsent = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
} as const

const deniedMarketing = {
  ...marketingConsent,
  marketing: 'denied'
} as const

test('mints fbp and fbc from page_url fbclid when cookies are empty (landing race)', () => {
  const result = ensureCanonicalMetaBrowserIds({
    clientIpAddress: '203.0.113.8',
    consent: marketingConsent,
    pageUrl:
      'https://utekos.no/?fbclid=IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk'
  })

  assert.ok(result.browserId?.fbp)
  assert.match(result.browserId!.fbp!, /^fb\.1\.\d+\.\d+/)
  assert.ok(result.browserId?.fbc)
  assert.equal(
    result.browserId!.fbc!.split('.')[3],
    'IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk'
  )
  assert.equal(
    result.clickId?.fbclid,
    'IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk'
  )
  assert.deepEqual(
    result.cookiesToSet.map(cookie => cookie.name).sort(),
    ['_fbc', '_fbp']
  )
})

test('reads fbclid from page_url query before API request URL (document URL wins)', () => {
  const result = ensureCanonicalMetaBrowserIds({
    consent: marketingConsent,
    pageUrl: 'https://utekos.no/produkter?fbclid=page-Click',
    requestUrl:
      'https://utekos.no/api/events/page-view?fbclid=request-click'
  })

  assert.equal(result.clickId?.fbclid, 'page-Click')
  assert.equal(
    result.browserId?.fbc?.split('.')[3],
    'page-Click'
  )
})

test('falls back to API request URL query when page_url has no fbclid', () => {
  const result = ensureCanonicalMetaBrowserIds({
    consent: marketingConsent,
    pageUrl: 'https://utekos.no/produkter',
    requestUrl:
      'https://utekos.no/api/events/page-view?fbclid=request-Click'
  })

  assert.equal(result.clickId?.fbclid, 'request-Click')
  assert.equal(
    result.browserId?.fbc?.split('.')[3],
    'request-Click'
  )
})

test('preserves case-sensitive fbclid from click_id when page_url has none', () => {
  const result = ensureCanonicalMetaBrowserIds({
    clickId: { fbclid: 'AbCdEf-123' },
    consent: marketingConsent,
    pageUrl: 'https://utekos.no/produkter'
  })

  assert.equal(result.clickId?.fbclid, 'AbCdEf-123')
  assert.equal(
    result.browserId?.fbc?.split('.')[3],
    'AbCdEf-123'
  )
  assert.ok(result.browserId?.fbp)
})

test('mints fbp alone when marketing is granted and no click id exists', () => {
  const result = ensureCanonicalMetaBrowserIds({
    consent: marketingConsent,
    pageUrl: 'https://utekos.no/'
  })

  assert.ok(result.browserId?.fbp)
  assert.equal(result.browserId?.fbc, undefined)
  assert.equal(result.clickId, undefined)
})

test('keeps existing first-party cookies and does not require rebuild', () => {
  const result = ensureCanonicalMetaBrowserIds({
    browserId: {
      fbc: 'fb.1.1784195000000.existing-click',
      fbp: 'fb.1.1784194900000.123456789'
    },
    clickId: { fbclid: 'existing-click' },
    consent: marketingConsent,
    cookieHeader:
      '_fbp=fb.1.1784194900000.123456789; _fbc=fb.1.1784195000000.existing-click',
    pageUrl: 'https://utekos.no/produkter'
  })

  assert.equal(
    result.browserId?.fbp,
    'fb.1.1784194900000.123456789'
  )
  assert.equal(
    result.browserId?.fbc,
    'fb.1.1784195000000.existing-click'
  )
  assert.deepEqual(result.cookiesToSet, [])
})

test('does not mint or retain Meta browser ids without marketing consent', () => {
  const result = ensureCanonicalMetaBrowserIds({
    browserId: { fbp: 'fb.1.1.1' },
    clickId: { fbclid: 'denied' },
    consent: deniedMarketing,
    pageUrl: 'https://utekos.no/?fbclid=denied'
  })

  assert.equal(result.browserId, undefined)
  assert.equal(result.clickId, undefined)
  assert.deepEqual(result.cookiesToSet, [])
})

test('refreshes fbc for a new landing click even when both Meta cookies exist', () => {
  const fbp = 'fb.1.1784194900000.123456789.AQQCAQMB'
  const fbc = 'fb.1.1784195000000.previous-click.AQQCAQMB'
  const before = Date.now()
  const result = ensureCanonicalMetaBrowserIds({
    browserId: { fbp, fbc },
    clickId: { fbclid: 'previous-click', gclid: 'google-click' },
    consent: marketingConsent,
    cookieHeader: `_fbp=${fbp}; _fbc=${fbc}`,
    pageUrl:
      'https://utekos.no/produkter?fbclid=New-CaseSensitive-Click'
  })

  assert.equal(
    result.browserId?.fbc?.split('.')[3],
    'New-CaseSensitive-Click'
  )
  assert.ok(
    Number(result.browserId?.fbc?.split('.')[2]) >= before
  )
  assert.equal(result.browserId?.fbp, fbp)
  assert.equal(result.clickId?.fbclid, 'New-CaseSensitive-Click')
  assert.equal(result.clickId?.gclid, 'google-click')
  assert.equal(
    result.cookiesToSet.find(cookie => cookie.name === '_fbc')
      ?.value,
    result.browserId?.fbc
  )
})

test('refreshes fbc from the API query fallback when both cookies exist', () => {
  const result = ensureCanonicalMetaBrowserIds({
    consent: marketingConsent,
    cookieHeader:
      '_fbp=fb.1.1784194900000.123456789.AQQCAQMB; _fbc=fb.1.1784195000000.previous-click.AQQCAQMB',
    pageUrl: 'https://utekos.no/produkter',
    requestUrl:
      'https://utekos.no/api/events/page-view?fbclid=New-Click'
  })

  assert.equal(result.browserId?.fbc?.split('.')[3], 'New-Click')
  assert.equal(result.clickId?.fbclid, 'New-Click')
})

test('does not refresh the timestamp or rewrite cookies for the same landing click', () => {
  const fbp = 'fb.1.1784194900000.123456789.AQQCAQMB'
  const fbc = 'fb.1.1784195000000.Same-Click.AQQCAQMB'
  const result = ensureCanonicalMetaBrowserIds({
    consent: marketingConsent,
    cookieHeader: `_fbp=${fbp}; _fbc=${fbc}`,
    pageUrl: 'https://utekos.no/produkter?fbclid=Same-Click'
  })

  assert.equal(result.browserId?.fbc, fbc)
  assert.equal(result.browserId?.fbp, fbp)
  assert.deepEqual(result.cookiesToSet, [])
})

test('a persisted click alone does not overwrite an existing fbc', () => {
  const fbc = 'fb.1.1784195000000.current-click.AQQCAQMB'
  const result = ensureCanonicalMetaBrowserIds({
    consent: marketingConsent,
    clickId: { fbclid: 'older-persisted-click' },
    cookieHeader: `_fbp=fb.1.1784194900000.123456789.AQQCAQMB; _fbc=${fbc}`,
    pageUrl: 'https://utekos.no/produkter'
  })

  assert.equal(result.browserId?.fbc, fbc)
  assert.deepEqual(result.cookiesToSet, [])
})
