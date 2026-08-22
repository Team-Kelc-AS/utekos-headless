import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAbandonedCheckoutRecoveryUnsubscribeUrl,
  verifyAbandonedCheckoutRecoveryUnsubscribeToken
} from './abandonedCheckoutRecoveryUnsubscribeToken'

const SECRET = 'a-secure-test-secret-with-more-than-32-bytes'
const NOW = new Date('2026-08-22T08:00:00.000Z')

test('creates an opaque token that round-trips the Shopify customer id', () => {
  const customerId = 'gid://shopify/Customer/123456'
  const unsubscribeUrl =
    createAbandonedCheckoutRecoveryUnsubscribeUrl(
      { shopifyCustomerId: customerId, now: NOW },
      {
        secret: SECRET,
        baseUrl: 'https://utekos.no',
        randomBytes: size => Buffer.alloc(size, 4)
      }
    )

  assert.doesNotMatch(unsubscribeUrl, /123456/u)
  const token = new URL(unsubscribeUrl).searchParams.get('token')!

  assert.deepEqual(
    verifyAbandonedCheckoutRecoveryUnsubscribeToken(token, {
      secret: SECRET,
      now: new Date('2027-01-01T00:00:00.000Z')
    }),
    { shopifyCustomerId: customerId }
  )
})

test('rejects tampered and expired tokens', () => {
  const unsubscribeUrl =
    createAbandonedCheckoutRecoveryUnsubscribeUrl(
      {
        shopifyCustomerId: 'gid://shopify/Customer/123456',
        now: NOW
      },
      {
        secret: SECRET,
        baseUrl: 'https://utekos.no',
        randomBytes: size => Buffer.alloc(size, 6)
      }
    )
  const token = new URL(unsubscribeUrl).searchParams.get('token')!

  assert.throws(
    () => verifyAbandonedCheckoutRecoveryUnsubscribeToken(
      `${token.slice(0, -1)}x`,
      { secret: SECRET, now: NOW }
    ),
    /token_invalid/u
  )
  assert.throws(
    () => verifyAbandonedCheckoutRecoveryUnsubscribeToken(
      token,
      {
        secret: SECRET,
        now: new Date('2028-01-01T00:00:00.000Z')
      }
    ),
    /token_invalid/u
  )
})
