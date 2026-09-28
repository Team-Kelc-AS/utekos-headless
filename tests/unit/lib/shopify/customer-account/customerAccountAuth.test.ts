import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCustomerAccountAuthState,
  encryptCustomerAccountSession,
  getHostedCustomerAccountLoginUrl,
  normalizeCustomerReturnTo,
  parseCustomerAccountTokenResponse,
  signCustomerAccountAuthState,
  verifyCustomerAccountAuthState
} from '@/lib/shopify/customer-account/customerAccountAuth'

const sessionSecret = 's'.repeat(32)

test('normalizes customer return paths and rejects external redirects', () => {
  assert.equal(
    normalizeCustomerReturnTo('/produkter/utekos-dun?size=L'),
    '/produkter/utekos-dun?size=L'
  )
  assert.equal(
    normalizeCustomerReturnTo('//example.com/path'),
    '/'
  )
  assert.equal(
    normalizeCustomerReturnTo('https://example.com'),
    '/'
  )
})

test('signs and verifies short-lived PKCE state', () => {
  const { codeChallenge, ...authState } =
    createCustomerAccountAuthState('/produkter/utekos-dun')
  const signed = signCustomerAccountAuthState(
    authState,
    sessionSecret
  )

  assert.match(codeChallenge, /^[A-Za-z0-9_-]{43}$/)
  assert.deepEqual(
    verifyCustomerAccountAuthState(signed, sessionSecret),
    authState
  )
  assert.equal(
    verifyCustomerAccountAuthState(`${signed}x`, sessionSecret),
    null
  )
})

test('builds the verified hosted login URL and encrypts access tokens', () => {
  assert.equal(
    getHostedCustomerAccountLoginUrl(
      'https://shopify.com/63421546744/account'
    ),
    'https://shopify.com/63421546744/account/login'
  )

  const token = parseCustomerAccountTokenResponse({
    access_token: 'customer-access-token',
    expires_in: 3600
  })
  const encrypted = encryptCustomerAccountSession(
    token,
    sessionSecret
  )

  assert.equal(encrypted.split('.').length, 3)
  assert.equal(encrypted.includes(token.access_token), false)
})
