import assert from 'node:assert/strict'
import test from 'node:test'

import { getCartCookieDefinition } from './getCartCookieDefinition'
import { publishCartIdentity } from './publishCartIdentity'

const fullId = 'gid://shopify/Cart/opaque?key=server-secret'

test('new cart cookies are HttpOnly with explicit browser protections', () => {
  assert.deepEqual(getCartCookieDefinition(fullId, true), {
    name: 'cartId',
    value: fullId,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/'
  })
})

test('bootstrap rewrites a legacy cookie and returns only its public identity', async () => {
  const refreshed: string[] = []

  const publicId = await publishCartIdentity(
    fullId,
    async value => {
      refreshed.push(value)
    },
    async () => {}
  )

  assert.equal(publicId, 'gid://shopify/Cart/opaque')
  assert.deepEqual(refreshed, [fullId])
})

test('bootstrap clears an invalid legacy cart cookie', async () => {
  let cleared = false

  const publicId = await publishCartIdentity(
    'invalid?key=legacy-secret',
    async () => {},
    async () => {
      cleared = true
    }
  )

  assert.equal(publicId, null)
  assert.equal(cleared, true)
})
