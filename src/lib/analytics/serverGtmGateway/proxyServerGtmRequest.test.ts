import assert from 'node:assert/strict'
import test from 'node:test'
import { proxyServerGtmRequest } from './proxyServerGtmRequest'

test('proxies a server GTM request and forces final no-store headers', async () => {
  let capturedUrl: URL | undefined
  let capturedInit: RequestInit | undefined
  const request = new Request(
    'https://utekos.no/__sgtm/g/collect?v=2&tid=GT-1',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer must-not-forward',
        'Content-Type': 'text/plain',
        'Cookie': '_ga=example',
        'Host': 'utekos.no',
        'X-Forwarded-For': '192.0.2.1'
      },
      body: 'payload'
    }
  )

  const response = await proxyServerGtmRequest(
    request,
    { params: Promise.resolve({ path: ['g', 'collect'] }) },
    async (input, init) => {
      capturedUrl = new URL(String(input))
      capturedInit = init

      return new Response('accepted', {
        status: 202,
        headers: {
          'Cache-Control': 'public, max-age=300',
          'Content-Encoding': 'gzip',
          'Content-Length': '8',
          'Content-Type': 'text/plain'
        }
      })
    }
  )

  assert.equal(
    capturedUrl?.href,
    'https://cloud.server.utekos.no/g/collect?v=2&tid=GT-1'
  )
  assert.equal(capturedInit?.method, 'POST')
  assert.equal(
    new TextDecoder().decode(capturedInit?.body as ArrayBuffer),
    'payload'
  )

  const requestHeaders = new Headers(capturedInit?.headers)
  assert.equal(requestHeaders.get('authorization'), null)
  assert.equal(requestHeaders.get('host'), null)
  assert.equal(requestHeaders.get('cookie'), '_ga=example')
  assert.equal(
    requestHeaders.get('x-forwarded-for'),
    '192.0.2.1'
  )
  assert.equal(
    requestHeaders.get('x-forwarded-host'),
    'utekos.no'
  )
  assert.equal(requestHeaders.get('x-forwarded-proto'), 'https')
  assert.equal(requestHeaders.get('accept-encoding'), 'identity')

  assert.equal(response.status, 202)
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, max-age=0'
  )
  assert.equal(
    response.headers.get('cdn-cache-control'),
    'no-store'
  )
  assert.equal(
    response.headers.get('vercel-cdn-cache-control'),
    'no-store'
  )
  assert.equal(response.headers.get('content-encoding'), null)
  assert.equal(response.headers.get('content-length'), null)
  assert.equal(await response.text(), 'accepted')
})

test('fails closed for an invalid upstream path', async () => {
  let fetched = false
  const response = await proxyServerGtmRequest(
    new Request('https://utekos.no/__sgtm/invalid'),
    { params: Promise.resolve({ path: ['..'] }) },
    async () => {
      fetched = true
      return new Response('unexpected')
    }
  )

  assert.equal(fetched, false)
  assert.equal(response.status, 400)
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, max-age=0'
  )
})

test('fails closed without exposing an upstream fetch error', async () => {
  const response = await proxyServerGtmRequest(
    new Request('https://utekos.no/__sgtm/healthy'),
    { params: Promise.resolve({ path: ['healthy'] }) },
    async () => {
      throw new Error('private upstream detail')
    }
  )

  assert.equal(response.status, 502)
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, max-age=0'
  )
  assert.equal(await response.text(), '')
})
