import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { encryptOverrides } from 'flags'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

const originalSecret = process.env.FLAGS_SECRET
const testSecret = Buffer.alloc(32, 7).toString('base64')
process.env.FLAGS_SECRET = testSecret

after(() => {
  if (originalSecret === undefined)
    delete process.env.FLAGS_SECRET
  else process.env.FLAGS_SECRET = originalSecret
})

const consent =
  'CookieConsent={necessary:true,statistics:true,marketing:false}'
const analyticsId = '_ga=GA1.1.123456789.1234567890'
const publicUrl =
  'https://utekos.no/skreddersy-varmen?variant=123&utm_campaign=Vinter%20Norge&fbclid=test-click'
const navigationHeaders: Record<string, string>[] = [
  { 'accept': 'text/html', 'sec-fetch-dest': 'document' },
  { accept: 'text/x-component', rsc: '1' },
  {
    'accept': 'text/x-component',
    'rsc': '1',
    'next-router-prefetch': '1',
    'purpose': 'prefetch'
  }
]

for (const variant of ['current', 'legacy']) {
  test(`serves the same ${variant} assignment for documents, RSC and prefetch`, async () => {
    const override = await encryptOverrides(
      { 'skreddersy-varmen-layout-v1': variant },
      testSecret,
      '10m'
    )
    for (const headers of navigationHeaders) {
      const response = await proxy(
        new NextRequest(publicUrl, {
          headers: {
            ...headers,
            cookie: `${consent}; ${analyticsId}; vercel-flag-overrides=${override}`
          }
        })
      )
      assert.equal(
        response.headers.get('x-middleware-rewrite'),
        `https://utekos.no/skreddersy-varmen/layout/${variant}?variant=123&utm_campaign=Vinter%20Norge&fbclid=test-click`
      )
      assert.equal(response.headers.get('location'), null)
      assert.equal(response.headers.get('set-cookie'), null)
      if (headers.rsc) {
        assert.equal(
          response.headers.get(
            'x-middleware-request-x-utekos-edge-request-id'
          ),
          null
        )
      } else {
        assert.ok(
          response.headers.get(
            'x-middleware-request-x-utekos-edge-request-id'
          )
        )
      }
    }
  })
}

test('does not assign a layout without both valid analytics consent and an analytics id', async () => {
  const override = await encryptOverrides(
    { 'skreddersy-varmen-layout-v1': 'legacy' },
    testSecret,
    '10m'
  )
  for (const cookies of [
    '',
    analyticsId,
    consent,
    `CookieConsent={statistics:false}; ${analyticsId}`,
    `${consent}; _ga=invalid!`,
    `${consent}; _ga=${'a'.repeat(257)}`
  ]) {
    const response = await proxy(
      new NextRequest(publicUrl, {
        headers: {
          accept: 'text/x-component',
          cookie: `${cookies}; vercel-flag-overrides=${override}`
        }
      })
    )
    assert.equal(
      response.headers.get('x-middleware-rewrite'),
      null
    )
    assert.equal(response.headers.get('x-middleware-next'), '1')
    assert.equal(response.headers.get('set-cookie'), null)
  }
})

test('redirects direct requests for internal variants to the public URL with attribution intact', async () => {
  for (const variant of ['current', 'legacy', 'unknown']) {
    const response = await proxy(
      new NextRequest(
        `https://utekos.no/skreddersy-varmen/layout/${variant}?variant=123&utm_source=test`
      )
    )
    assert.equal(response.status, 307)
    assert.equal(
      response.headers.get('location'),
      'https://utekos.no/skreddersy-varmen?variant=123&utm_source=test'
    )
  }
})

test('leaves the original product route outside layout routing', async () => {
  const response = await proxy(
    new NextRequest(
      'https://utekos.no/skreddersy-varmen/utekos-orginal'
    )
  )
  assert.equal(
    response.headers.get('x-middleware-rewrite'),
    null
  )
  assert.equal(response.headers.get('location'), null)
})
