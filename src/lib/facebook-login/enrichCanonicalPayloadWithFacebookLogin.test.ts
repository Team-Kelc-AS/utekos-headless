import assert from 'node:assert/strict'
import test from 'node:test'
import { randomBytes } from 'node:crypto'
import { encryptFacebookLoginJson } from './facebookLoginCrypto'
import {
  FACEBOOK_LOGIN_IDENTITY_COOKIE,
  facebookLoginIdentityCookieSchema
} from './facebookLoginContracts'
import { enrichCanonicalPayloadWithFacebookLogin } from './enrichCanonicalPayloadWithFacebookLogin'

const identityKey = randomBytes(32)
const environment = {
  FACEBOOK_LOGIN_APP_ID: '765889899872191',
  FACEBOOK_LOGIN_APP_SECRET: 'test-secret',
  FACEBOOK_LOGIN_ENABLED: 'true',
  FACEBOOK_LOGIN_IDENTITY_KEY: identityKey.toString('base64')
}

type EnrichedPayload = {
  browser_id: { fbc?: string }
  click_id: { fbclid?: string }
  external_id?: string
  user_data: {
    email_sha256?: string[]
    facebook_login_id?: string
    phone_sha256?: string[]
  }
}

function cookieHeader() {
  const identity = facebookLoginIdentityCookieSchema.parse({
    emailSha256: 'a'.repeat(64),
    expiresAt: Date.now() + 60_000,
    externalId: 'anon_550e8400-e29b-41d4-a716-446655440000',
    facebookLoginId: '1234567890',
    fbc: 'fb.1.1780000000000.meta-click',
    fbclid: 'meta-click',
    identityId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
  })
  const token = encryptFacebookLoginJson(
    identity,
    'identity-cookie',
    identityKey
  )
  return `${FACEBOOK_LOGIN_IDENTITY_COOKIE}=${encodeURIComponent(token)}`
}

test('enriches a consented event at the server boundary', () => {
  const enriched = enrichCanonicalPayloadWithFacebookLogin(
    {
      consent: { marketing: 'granted' },
      user_data: { phone_sha256: ['b'.repeat(64)] }
    },
    cookieHeader(),
    environment
  ) as EnrichedPayload

  assert.equal(
    enriched.user_data.facebook_login_id,
    '1234567890'
  )
  assert.deepEqual(enriched.user_data.email_sha256, [
    'a'.repeat(64)
  ])
  assert.deepEqual(enriched.user_data.phone_sha256, [
    'b'.repeat(64)
  ])
  assert.equal(
    enriched.browser_id.fbc,
    'fb.1.1780000000000.meta-click'
  )
  assert.equal(enriched.click_id.fbclid, 'meta-click')
  assert.equal(
    enriched.external_id,
    'anon_550e8400-e29b-41d4-a716-446655440000'
  )
})

test('does not attach Facebook identity without marketing consent', () => {
  const payload = { consent: { marketing: 'denied' } }
  assert.equal(
    enrichCanonicalPayloadWithFacebookLogin(
      payload,
      cookieHeader(),
      environment
    ),
    payload
  )
})
