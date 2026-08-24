import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'
import {
  isFacebookLoginEnabled,
  readFacebookLoginConfig
} from './facebookLoginConfig'

const identityKey = randomBytes(32).toString('base64')

test('enables Facebook Login when the feature is configured', () => {
  assert.equal(
    isFacebookLoginEnabled({
      FACEBOOK_LOGIN_ENABLED: 'true'
    }),
    true
  )
  assert.equal(
    isFacebookLoginEnabled({
      FACEBOOK_LOGIN_ENABLED: 'true',
      VERCEL_ENV: 'production'
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
