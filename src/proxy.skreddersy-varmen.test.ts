import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

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

test('serves the public landing page without a layout rewrite', async () => {
  for (const headers of navigationHeaders) {
    const response = await proxy(
      new NextRequest(publicUrl, { headers })
    )
    assert.equal(
      response.headers.get('x-middleware-rewrite'),
      null
    )
    assert.equal(response.headers.get('location'), null)
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

test('redirects retired internal layout URLs to the public landing with attribution intact', async () => {
  for (const variant of ['current', 'legacy', 'unknown']) {
    const response = await proxy(
      new NextRequest(
        `https://utekos.no/skreddersy-varmen/layout/${variant}?variant=123&farge=patriot-blue&storrelse=XL&kjonn=unisex&utm_source=test&ScCid=AbC%2B%2f%3D&email=synthetic%40example.invalid&unknown=removed`
      )
    )
    assert.equal(response.status, 307)
    assert.equal(
      response.headers.get('location'),
      'https://utekos.no/skreddersy-varmen?variant=123&farge=patriot-blue&storrelse=XL&kjonn=unisex&utm_source=test&ScCid=AbC%2B%2f%3D'
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
