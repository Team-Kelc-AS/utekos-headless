import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'
import {
  isFacebookLoginEnabled,
  isFacebookLoginPreviewAllowed,
  readFacebookLoginClientConfig,
  readFacebookLoginConfig
} from './facebookLoginConfig'

const identityKey = randomBytes(32).toString('base64')

test('allows the login prompt preview override only on Vercel preview', () => {
  assert.equal(
    isFacebookLoginPreviewAllowed({ VERCEL_ENV: 'preview' }),
    true
  )
  assert.equal(
    isFacebookLoginPreviewAllowed({ VERCEL_ENV: 'production' }),
    false
  )
  assert.equal(
    isFacebookLoginPreviewAllowed({
      NODE_ENV: 'development',
      VERCEL_ENV: 'development'
    }),
    false
  )
  assert.equal(isFacebookLoginPreviewAllowed({}), false)
})

test('enables Facebook Login only on Vercel preview', () => {
  assert.equal(
    isFacebookLoginEnabled({ FACEBOOK_LOGIN_ENABLED: 'true' }),
    false
  )
  assert.equal(
    isFacebookLoginEnabled({
      FACEBOOK_LOGIN_ENABLED: 'true',
      VERCEL_ENV: 'production'
    }),
    false
  )
  assert.equal(
    isFacebookLoginEnabled({
      FACEBOOK_LOGIN_ENABLED: 'true',
      VERCEL_ENV: 'preview'
    }),
    true
  )
  assert.equal(
    isFacebookLoginEnabled({
      FACEBOOK_LOGIN_ENABLED: 'false',
      VERCEL_ENV: 'preview'
    }),
    false
  )
})

test('uses dedicated consumer-login credentials', () => {
  const config = readFacebookLoginConfig({
    FACEBOOK_LOGIN_APP_ID: '1234567890',
    FACEBOOK_LOGIN_APP_SECRET: 'consumer-secret',
    FACEBOOK_LOGIN_ENABLED: 'true',
    FACEBOOK_LOGIN_IDENTITY_KEY: identityKey,
    FACEBOOK_LOGIN_REDIRECT_ORIGIN: 'https://utekos.no'
  })

  assert.equal(config.appId, '1234567890')
  assert.equal(config.appSecret, 'consumer-secret')
  assert.equal(config.redirectOrigin, 'https://utekos.no')
})

test('exposes only the public SDK configuration to the client', () => {
  assert.deepEqual(
    readFacebookLoginClientConfig({
      FACEBOOK_LOGIN_APP_ID: '1234567890',
      FACEBOOK_LOGIN_APP_SECRET: 'must-not-be-exposed'
    }),
    { apiVersion: 'v26.0', appId: '1234567890' }
  )
  assert.equal(
    readFacebookLoginClientConfig({
      FACEBOOK_LOGIN_APP_ID: 'invalid-app-id'
    }),
    undefined
  )
})

test('does not reuse Marketing API app credentials', () => {
  assert.throws(
    () =>
      readFacebookLoginConfig({
        FACEBOOK_LOGIN_ENABLED: 'true',
        FACEBOOK_LOGIN_IDENTITY_KEY: identityKey,
        META_APP_ID: '1234567890',
        META_APP_SECRET: 'marketing-secret'
      }),
    /facebook_login_app_id_invalid/u
  )
})

test('allows a complete disabled configuration only for an explicit preview caller', () => {
  assert.equal(
    readFacebookLoginConfig(
      {
        FACEBOOK_LOGIN_APP_ID: '1234567890',
        FACEBOOK_LOGIN_APP_SECRET: 'consumer-secret',
        FACEBOOK_LOGIN_ENABLED: 'false',
        FACEBOOK_LOGIN_IDENTITY_KEY: identityKey,
        FACEBOOK_LOGIN_REDIRECT_ORIGIN: 'https://utekos.no'
      },
      { allowDisabled: true }
    ).appId,
    '1234567890'
  )

  assert.throws(
    () =>
      readFacebookLoginConfig({
        FACEBOOK_LOGIN_APP_ID: '1234567890',
        FACEBOOK_LOGIN_APP_SECRET: 'consumer-secret',
        FACEBOOK_LOGIN_ENABLED: 'false',
        FACEBOOK_LOGIN_IDENTITY_KEY: identityKey,
        FACEBOOK_LOGIN_REDIRECT_ORIGIN: 'https://utekos.no'
      }),
    /facebook_login_disabled/u
  )
})

test('requires an explicit redirect origin in preview', () => {
  assert.throws(
    () =>
      readFacebookLoginConfig({
        FACEBOOK_LOGIN_APP_ID: '1234567890',
        FACEBOOK_LOGIN_APP_SECRET: 'consumer-secret',
        FACEBOOK_LOGIN_ENABLED: 'true',
        FACEBOOK_LOGIN_IDENTITY_KEY: identityKey,
        VERCEL_ENV: 'preview'
      }),
    /facebook_login_preview_origin_missing/u
  )
})
