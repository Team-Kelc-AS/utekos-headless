import assert from 'node:assert/strict'
import test from 'node:test'
import { randomBytes } from 'node:crypto'
import { facebookLoginIdentityCookieSchema } from './facebookLoginContracts'
import {
  decryptFacebookLoginJson,
  encryptFacebookLoginJson
} from './facebookLoginCrypto'

test('encrypts and authenticates the server-only identity cookie', () => {
  const key = randomBytes(32)
  const value = facebookLoginIdentityCookieSchema.parse({
    expiresAt: Date.now() + 60_000,
    externalId: 'anon_550e8400-e29b-41d4-a716-446655440000',
    facebookLoginId: '1234567890',
    identityId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
  })
  const token = encryptFacebookLoginJson(
    value,
    'identity-cookie',
    key
  )

  assert.equal(token.includes(value.facebookLoginId), false)
  assert.deepEqual(
    decryptFacebookLoginJson(
      token,
      'identity-cookie',
      key,
      facebookLoginIdentityCookieSchema
    ),
    value
  )

  const tokenParts = token.split('.')
  const tag = Buffer.from(tokenParts[3] ?? '', 'base64url')
  tag[0] = (tag[0] ?? 0) ^ 1
  tokenParts[3] = tag.toString('base64url')

  assert.throws(() =>
    decryptFacebookLoginJson(
      tokenParts.join('.'),
      'identity-cookie',
      key,
      facebookLoginIdentityCookieSchema
    )
  )
})
