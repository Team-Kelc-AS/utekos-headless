import assert from 'node:assert/strict'
import test from 'node:test'
import { randomBytes } from 'node:crypto'
import type { FacebookLoginConfig } from './facebookLoginConfig'
import {
  buildFacebookLoginDialogUrl,
  createFacebookLoginOAuthContext,
  exchangeFacebookLoginCode,
  validateFacebookLoginAccessToken
} from './facebookLoginOAuth'

const config: FacebookLoginConfig = {
  apiVersion: 'v25.0',
  appId: '1154247890253046',
  appSecret: 'test-app-secret',
  identityKey: randomBytes(32),
  redirectOrigin: 'https://preview.utekos.no'
}

test('captures current Meta attribution in the OAuth state', () => {
  const context = createFacebookLoginOAuthContext({
    cookieHeader:
      '_fbc=fb.1.1780000000000.meta-click; utekos_external_id=anon_550e8400-e29b-41d4-a716-446655440000',
    now: 1_787_500_000_000,
    origin: 'https://preview.utekos.no',
    returnTo:
      '/produkter?fbclid=meta-click&campaign_id=1201&ad_id=1203'
  })

  assert.equal(context.fbclid, 'meta-click')
  assert.equal(context.attribution?.campaign_id, '1201')
  assert.equal(context.attribution?.ad_id, '1203')
  assert.equal(
    context.externalId,
    'anon_550e8400-e29b-41d4-a716-446655440000'
  )
})

test('builds the minimal server-side Facebook Login dialog', () => {
  const context = createFacebookLoginOAuthContext({
    cookieHeader: undefined,
    origin: config.redirectOrigin,
    returnTo: '/'
  })
  const url = buildFacebookLoginDialogUrl(config, context)

  assert.equal(url.hostname, 'www.facebook.com')
  assert.equal(url.pathname, '/v25.0/dialog/oauth')
  assert.equal(url.searchParams.get('response_type'), 'code')
  assert.equal(
    url.searchParams.get('scope'),
    'public_profile,email'
  )
  assert.equal(
    url.searchParams.get('redirect_uri'),
    'https://preview.utekos.no/api/identity/facebook/callback'
  )
})

test('validates app and user identity before returning profile data', async () => {
  const calls: URL[] = []
  const responses = [
    { access_token: 'short-lived-user-token' },
    {
      data: {
        app_id: config.appId,
        is_valid: true,
        scopes: ['public_profile', 'email'],
        user_id: '1234567890'
      }
    },
    { id: '1234567890', email: 'kunde@example.com' }
  ]
  const fetchFn: typeof fetch = async input => {
    calls.push(new URL(String(input)))
    return Response.json(responses.shift())
  }

  const identity = await exchangeFacebookLoginCode({
    code: 'one-time-code',
    config,
    fetchFn
  })

  assert.deepEqual(identity, {
    facebookLoginId: '1234567890',
    email: 'kunde@example.com',
    emailPermissionGranted: true
  })
  assert.equal(calls.length, 3)
  assert.equal(calls[1]?.pathname, '/v25.0/debug_token')
  assert.equal(calls[2]?.pathname, '/v25.0/me')
  assert.ok(calls[2]?.searchParams.get('appsecret_proof'))
})

test('validates an SDK token against the expected app-scoped user', async () => {
  const responses = [
    {
      data: {
        app_id: config.appId,
        is_valid: true,
        scopes: ['public_profile'],
        user_id: '1234567890'
      }
    },
    { id: '1234567890' }
  ]
  const fetchFn: typeof fetch = async () =>
    Response.json(responses.shift())

  const identity = await validateFacebookLoginAccessToken({
    accessToken: 'sdk-user-access-token-for-testing',
    config,
    expectedUserId: '1234567890',
    fetchFn
  })

  assert.deepEqual(identity, {
    facebookLoginId: '1234567890',
    emailPermissionGranted: false
  })
})

test('rejects an SDK token for another app-scoped user', async () => {
  const fetchFn: typeof fetch = async () =>
    Response.json({
      data: {
        app_id: config.appId,
        is_valid: true,
        scopes: ['public_profile'],
        user_id: '1234567890'
      }
    })

  await assert.rejects(
    validateFacebookLoginAccessToken({
      accessToken: 'sdk-user-access-token-for-testing',
      config,
      expectedUserId: '9999999999',
      fetchFn
    }),
    /facebook_login_token_identity_invalid/u
  )
})
