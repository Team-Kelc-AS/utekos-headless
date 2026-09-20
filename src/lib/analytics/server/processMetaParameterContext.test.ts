import assert from 'node:assert/strict'
import test from 'node:test'
import { processMetaParameterContext } from './processMetaParameterContext'

const consent = {
  analytics: 'denied',
  marketing: 'granted',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
} as const

test('uses the first repeated URL click consistently with canonical and browser readers', () => {
  const result = processMetaParameterContext({
    cookies: {},
    payload: {
      consent,
      page_url: 'https://utekos.no/?fbclid=First&fbclid=Second'
    }
  })
  assert.equal(result.identifiers.fbc?.split('.')[3], 'First')
})

test('creates first-party fbp and fbc from the observed landing fbclid', () => {
  const before = Date.now()
  const processed = processMetaParameterContext({
    clientIpAddress: '203.0.113.8',
    cookies: {},
    payload: {
      consent,
      page_url:
        'https://utekos.no/produkter?fbclid=landing-click'
    }
  })
  const after = Date.now()
  const fbcSegments = processed.identifiers.fbc?.split('.')

  assert.equal(fbcSegments?.[0], 'fb')
  assert.equal(fbcSegments?.[1], '1')
  assert.ok(Number(fbcSegments?.[2]) >= before)
  assert.ok(Number(fbcSegments?.[2]) <= after)
  assert.equal(fbcSegments?.[3], 'landing-click')
  assert.match(processed.identifiers.fbp, /^fb\.1\.\d+\.\d+\./)
  assert.deepEqual(
    processed.cookiesToSet.map(cookie => cookie.name).sort(),
    ['_fbc', '_fbp']
  )
})

test('uses a visit-persisted fbclid after an internal navigation', () => {
  const processed = processMetaParameterContext({
    cookies: {},
    payload: {
      consent,
      fbclid: 'persisted-click',
      page_url: 'https://utekos.no/handlekurv'
    }
  })

  assert.equal(
    processed.identifiers.fbc?.split('.')[3],
    'persisted-click'
  )
})

test('creates host-compatible identifiers on a Vercel preview domain', () => {
  const processed = processMetaParameterContext({
    cookies: {},
    payload: {
      consent,
      page_url:
        'https://utekos-headless-git-meta-preview.vercel.app/?fbclid=preview-click'
    }
  })

  assert.match(
    processed.identifiers.fbc ?? '',
    /^fb\.1\.\d+\.preview-click\./
  )
  assert.match(processed.identifiers.fbp, /^fb\.1\.\d+\.\d+\./)
})

test('preserves existing valid Meta cookies when no newer click exists', () => {
  const existingFbc = 'fb.1.1784195000000.existing-click'
  const existingFbp = 'fb.1.1784194900000.123456789'
  const processed = processMetaParameterContext({
    cookies: { _fbc: existingFbc, _fbp: existingFbp },
    payload: {
      consent,
      page_url: 'https://utekos.no/handlekurv'
    }
  })

  assert.match(
    processed.identifiers.fbc ?? '',
    /^fb\.1\.1784195000000\.existing-click\./
  )
  assert.match(
    processed.identifiers.fbp,
    /^fb\.1\.1784194900000\.123456789\./
  )
})
