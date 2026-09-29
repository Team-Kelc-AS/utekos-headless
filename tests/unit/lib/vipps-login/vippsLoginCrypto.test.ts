import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'
import { vippsLoginOAuthContextSchema } from '@/lib/vipps-login/vippsLoginContracts'
import {
  decryptVippsLoginJson,
  encryptVippsLoginJson
} from '@/lib/vipps-login/vippsLoginCrypto'

test('round-trips an encrypted OAuth state without exposing its verifier', () => {
  const key = randomBytes(32)
  const context = {
    codeVerifier: 'v'.repeat(64),
    issuedAt: 1_788_000_000_000,
    returnTo: '/produkter?fra=kurv',
    state: 's'.repeat(32)
  }
  const token = encryptVippsLoginJson(
    context,
    'oauth-state',
    key,
    () => Buffer.alloc(12, 7)
  )

  assert.doesNotMatch(token, /v{12}|s{12}|produkter/u)
  assert.deepEqual(
    decryptVippsLoginJson(
      token,
      'oauth-state',
      key,
      vippsLoginOAuthContextSchema
    ),
    context
  )
})

test('rejects a modified OAuth state cookie', () => {
  const key = randomBytes(32)
  const token = encryptVippsLoginJson(
    {
      codeVerifier: 'v'.repeat(64),
      issuedAt: 1_788_000_000_000,
      returnTo: '/',
      state: 's'.repeat(32)
    },
    'oauth-state',
    key
  )
  const tampered = `${token.slice(0, -1)}${
    token.endsWith('A') ? 'B' : 'A'
  }`

  assert.throws(() =>
    decryptVippsLoginJson(
      tampered,
      'oauth-state',
      key,
      vippsLoginOAuthContextSchema
    )
  )
})
