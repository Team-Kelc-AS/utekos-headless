import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { handleVippsLoginCallback } from '@/app/api/identity/vipps/callback/route'
import { handleVippsLoginStart } from '@/app/api/identity/vipps/start/route'
import {
  VIPPS_LOGIN_IDENTITY_COOKIE,
  VIPPS_LOGIN_OAUTH_COOKIE,
  type VippsLoginOAuthContext
} from '@/lib/vipps-login/vippsLoginContracts'
import type { VippsLoginConfig } from '@/lib/vipps-login/vippsLoginConfig'

const now = 1_788_000_000_000
const config: VippsLoginConfig = {
  apiBaseUrl: 'https://apitest.vipps.no',
  callbackUrl: 'https://utekos.no/api/identity/vipps/callback',
  clientId: 'test-client',
  clientSecret: 'test-secret',
  environment: 'test',
  issuer: new URL(
    'https://apitest.vipps.no/access-management-1.0/access/'
  ),
  redirectOrigin: 'https://utekos.no',
  sessionKey: randomBytes(32)
}
const context: VippsLoginOAuthContext = {
  codeVerifier: 'v'.repeat(64),
  issuedAt: now,
  returnTo: '/produkter?fra=kurv',
  state: 's'.repeat(32)
}

test('start route sets a protected short-lived state cookie and redirects top-level', async () => {
  const response = await handleVippsLoginStart(
    new NextRequest(
      'https://utekos.no/api/identity/vipps/start?return_to=%2Fprodukter%3Ffra%3Dkurv'
    ),
    {
      createAuthorization: async input => {
        assert.equal(input.returnTo, context.returnTo)
        return {
          authorizationUrl: new URL(
            'https://apitest.vipps.no/access-management-1.0/access/oauth2/auth?state=test'
          ),
          context
        }
      },
      encryptContext: () => 'encrypted-oauth-context',
      readConfig: () => config
    }
  )

  assert.equal(response.status, 302)
  assert.equal(
    response.headers.get('location'),
    'https://apitest.vipps.no/access-management-1.0/access/oauth2/auth?state=test'
  )
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, max-age=0'
  )
  const cookie = response.headers.get('set-cookie') ?? ''
  assert.match(cookie, new RegExp(VIPPS_LOGIN_OAUTH_COOKIE, 'u'))
  assert.match(cookie, /HttpOnly/u)
  assert.match(cookie, /SameSite=lax/iu)
  assert.match(cookie, /Path=\/api\/identity\/vipps/u)
})

test('start route returns safely when Login configuration is unavailable', async () => {
  const response = await handleVippsLoginStart(
    new NextRequest(
      'https://utekos.no/api/identity/vipps/start',
      {
        headers: {
          referer: 'https://utekos.no/produkter?fra=kurv'
        }
      }
    ),
    {
      createAuthorization: async () => {
        throw new Error('must_not_run')
      },
      encryptContext: () => 'must-not-run',
      readConfig: () => {
        throw new Error('vipps_login_disabled')
      }
    }
  )

  const location = new URL(response.headers.get('location')!)
  assert.equal(location.origin, 'https://utekos.no')
  assert.equal(location.pathname, '/produkter')
  assert.equal(location.searchParams.get('fra'), 'kurv')
  assert.equal(
    location.searchParams.get('vipps_login'),
    'unavailable'
  )
})

test('callback route stores only the validated provider identity and clears OAuth state', async () => {
  const requestUrl = new URL(config.callbackUrl)
  requestUrl.searchParams.set('code', 'single-use-code')
  requestUrl.searchParams.set('state', context.state)
  const response = await handleVippsLoginCallback(
    new NextRequest(requestUrl, {
      headers: {
        cookie: `${VIPPS_LOGIN_OAUTH_COOKIE}=encrypted-oauth-context`
      }
    }),
    {
      completeAuthorization: async () => ({
        identity: {
          authenticatedAt: now,
          expiresAt: now + 3600 * 1000,
          issuer: config.issuer.href,
          sub: 'vipps-user-sub'
        },
        kind: 'connected'
      }),
      decryptContext: () => context,
      encryptIdentity: identity => {
        assert.equal(identity.sub, 'vipps-user-sub')
        return 'encrypted-provider-identity'
      },
      now: () => now,
      readConfig: () => config
    }
  )

  const location = new URL(response.headers.get('location')!)
  assert.equal(location.pathname, '/produkter')
  assert.equal(location.searchParams.get('fra'), 'kurv')
  assert.equal(
    location.searchParams.get('vipps_login'),
    'connected'
  )
  const cookies = response.headers.get('set-cookie') ?? ''
  assert.match(
    cookies,
    new RegExp(VIPPS_LOGIN_IDENTITY_COOKIE, 'u')
  )
  assert.match(cookies, /encrypted-provider-identity/u)
  assert.match(
    cookies,
    new RegExp(`${VIPPS_LOGIN_OAUTH_COOKIE}=`, 'u')
  )
  assert.match(cookies, /Max-Age=0/u)
})

test('callback route treats user cancellation as a normal redirect without identity cookie', async () => {
  const response = await handleVippsLoginCallback(
    new NextRequest(
      `${config.callbackUrl}?error=access_granted&state=${context.state}`,
      {
        headers: {
          cookie: `${VIPPS_LOGIN_OAUTH_COOKIE}=encrypted-oauth-context`
        }
      }
    ),
    {
      completeAuthorization: async () => ({ kind: 'cancelled' }),
      decryptContext: () => context,
      encryptIdentity: () => 'must-not-run',
      now: () => now,
      readConfig: () => config
    }
  )

  const location = new URL(response.headers.get('location')!)
  assert.equal(
    location.searchParams.get('vipps_login'),
    'cancelled'
  )
  assert.doesNotMatch(
    response.headers.get('set-cookie') ?? '',
    new RegExp(VIPPS_LOGIN_IDENTITY_COOKIE, 'u')
  )
})
