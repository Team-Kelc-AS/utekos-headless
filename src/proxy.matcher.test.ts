import assert from 'node:assert/strict'
import test from 'node:test'
import { unstable_doesMiddlewareMatch } from 'next/dist/experimental/testing/server/middleware-testing-utils'
import { config } from './proxy'

function proxyMatches(
  url: string,
  headers: Record<string, string> = {}
) {
  return unstable_doesMiddlewareMatch({ config, headers, url })
}

test('matches only document navigations and required proxy routes', () => {
  assert.equal(
    proxyMatches('https://utekos.no/skreddersy-varmen', {
      'accept': 'text/html,application/xhtml+xml',
      'sec-fetch-dest': 'document'
    }),
    true
  )
  assert.equal(
    proxyMatches('https://utekos.no/magasinet', {
      accept: 'text/html'
    }),
    true
  )
  assert.equal(
    proxyMatches('https://utekos.no/', {
      referer: 'https://bergenhordaland.nbocc.no/medlemmer'
    }),
    true
  )
  assert.equal(
    proxyMatches('https://feed.utekos.no/klarna-feed.xml'),
    true
  )
  assert.equal(
    proxyMatches(
      'https://utekos.no/analytics/meta-pixel-canonical-v1.js',
      { 'accept': '*/*', 'sec-fetch-dest': 'script' }
    ),
    false
  )
  assert.equal(
    proxyMatches(
      'https://utekos.no/_next/static/chunks/app.js',
      { 'accept': '*/*', 'sec-fetch-dest': 'script' }
    ),
    false
  )
  assert.equal(
    proxyMatches('https://utekos.no/produkter/utekos-dun', {
      accept: 'text/html, text/x-component',
      rsc: '1'
    }),
    false
  )
  assert.equal(
    proxyMatches('https://utekos.no/produkter/utekos-dun', {
      accept: 'text/html',
      purpose: 'prefetch'
    }),
    false
  )
})
