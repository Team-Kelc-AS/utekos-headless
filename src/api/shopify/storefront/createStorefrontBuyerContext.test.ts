import assert from 'node:assert/strict'
import test from 'node:test'
import { createStorefrontBuyerContext } from './createStorefrontBuyerContext'

test('accepts a validated request-scoped IPv4 or IPv6 address', () => {
  assert.deepEqual(
    createStorefrontBuyerContext(
      new Headers({ 'x-real-ip': '203.0.113.8' })
    ),
    { buyerIp: '203.0.113.8' }
  )

  assert.deepEqual(
    createStorefrontBuyerContext(
      new Headers({ 'x-real-ip': '2001:db8::8' })
    ),
    { buyerIp: '2001:db8::8' }
  )
})

test('does not forward unvalidated or caller-selected proxy headers', () => {
  assert.deepEqual(
    createStorefrontBuyerContext(
      new Headers({
        'x-forwarded-for': '203.0.113.8',
        'x-real-ip': 'not-an-ip'
      })
    ),
    { buyerIp: null }
  )

  assert.deepEqual(
    createStorefrontBuyerContext(
      new Headers({ 'x-forwarded-for': '203.0.113.8' })
    ),
    { buyerIp: null }
  )
})

test('uses the injected platform IP resolver as the trust boundary', () => {
  const requestHeaders = new Headers({
    'x-platform-client-ip': '198.51.100.24'
  })

  assert.deepEqual(
    createStorefrontBuyerContext(
      requestHeaders,
      headers => headers.get('x-platform-client-ip') ?? undefined
    ),
    { buyerIp: '198.51.100.24' }
  )
})
