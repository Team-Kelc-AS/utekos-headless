import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'
import { readVippsLoginConfig } from '@/lib/vipps-login/vippsLoginConfig'

const sessionSecret = randomBytes(32).toString('base64')

test('builds the exact production issuer and callback from production credentials', () => {
  const config = readVippsLoginConfig({
    VIPPS_CLIENT_ID: 'production-client',
    VIPPS_CLIENT_SECRET: 'production-secret',
    VIPPS_ENVIRONMENT: 'production',
    VIPPS_LOGIN_ENABLED: 'true',
    VIPPS_LOGIN_REDIRECT_ORIGIN: 'https://utekos.no',
    VIPPS_LOGIN_SESSION_SECRET: sessionSecret
  })

  assert.equal(config.environment, 'production')
  assert.equal(config.apiBaseUrl, 'https://api.vipps.no')
  assert.equal(
    config.issuer.href,
    'https://api.vipps.no/access-management-1.0/access/'
  )
  assert.equal(
    config.callbackUrl,
    'https://utekos.no/api/identity/vipps/callback'
  )
})

test('keeps test and production credentials separated', () => {
  const config = readVippsLoginConfig({
    VIPPS_CLIENT_ID: 'must-not-be-used',
    VIPPS_CLIENT_SECRET: 'must-not-be-used',
    VIPPS_ENVIRONMENT: 'test',
    VIPPS_LOGIN_ENABLED: 'true',
    VIPPS_LOGIN_REDIRECT_ORIGIN: 'http://localhost:3000',
    VIPPS_LOGIN_SESSION_SECRET: sessionSecret,
    VIPPS_TEST_CLIENT_ID: 'test-client',
    VIPPS_TEST_CLIENT_SECRET: 'test-secret'
  })

  assert.equal(config.clientId, 'test-client')
  assert.equal(config.clientSecret, 'test-secret')
  assert.equal(
    config.issuer.href,
    'https://apitest.vipps.no/access-management-1.0/access/'
  )
  assert.equal(
    config.callbackUrl,
    'http://localhost:3000/api/identity/vipps/callback'
  )
})

test('fails closed when Login or its exact callback configuration is missing', () => {
  const base = {
    VIPPS_ENVIRONMENT: 'test',
    VIPPS_LOGIN_ENABLED: 'true',
    VIPPS_LOGIN_REDIRECT_ORIGIN: 'http://localhost:3000',
    VIPPS_LOGIN_SESSION_SECRET: sessionSecret,
    VIPPS_TEST_CLIENT_ID: 'test-client',
    VIPPS_TEST_CLIENT_SECRET: 'test-secret'
  }

  assert.throws(
    () =>
      readVippsLoginConfig({
        ...base,
        VIPPS_LOGIN_ENABLED: 'false'
      }),
    /vipps_login_disabled/u
  )
  assert.throws(
    () =>
      readVippsLoginConfig({
        ...base,
        VIPPS_LOGIN_REDIRECT_ORIGIN: undefined
      }),
    /vipps_login_redirect_origin_missing/u
  )
  assert.throws(
    () =>
      readVippsLoginConfig({
        ...base,
        VIPPS_LOGIN_REDIRECT_ORIGIN: 'http://example.com'
      }),
    /vipps_login_redirect_origin_invalid/u
  )
  assert.throws(
    () =>
      readVippsLoginConfig({
        ...base,
        VIPPS_LOGIN_SESSION_SECRET: 'not-a-32-byte-key'
      }),
    /vipps_login_session_secret_invalid/u
  )
})
