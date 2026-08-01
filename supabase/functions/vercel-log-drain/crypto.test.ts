import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import {
  computeHmacHex,
  verifyVercelSignature
} from './crypto.ts'

test('computes the Vercel HMAC-SHA1 over the exact raw body bytes', async () => {
  const secret = 'drain-secret-that-is-at-least-32-characters'
  const body = new TextEncoder().encode(
    '[{"id":"log-1","text":"æøå"}]'
  )
  const expected = createHmac('sha1', secret)
    .update(body)
    .digest('hex')

  assert.equal(
    await computeHmacHex(body, secret, 'SHA-1'),
    expected
  )
  assert.equal(
    await verifyVercelSignature(body, expected, secret),
    true
  )
})

test('rejects missing, malformed, truncated and incorrect signatures', async () => {
  const secret = 'drain-secret-that-is-at-least-32-characters'
  const body = new TextEncoder().encode('[]')
  const expected = createHmac('sha1', secret)
    .update(body)
    .digest('hex')

  assert.equal(
    await verifyVercelSignature(body, null, secret),
    false
  )
  assert.equal(
    await verifyVercelSignature(body, 'not-hex', secret),
    false
  )
  assert.equal(
    await verifyVercelSignature(body, expected.slice(2), secret),
    false
  )
  assert.equal(
    await verifyVercelSignature(
      body,
      `${expected.slice(0, -1)}0`,
      secret
    ),
    false
  )
})
