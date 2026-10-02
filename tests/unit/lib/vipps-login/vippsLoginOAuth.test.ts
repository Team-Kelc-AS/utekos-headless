import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'
import * as oidc from 'openid-client'
import type { VippsLoginConfig } from '@/lib/vipps-login/vippsLoginConfig'
import {
  completeVippsLoginAuthorization,
  createVippsLoginAuthorization,
  normalizeVippsLoginReturnTo,
  validateVippsLoginCallback,
  type VippsOidcOperations
} from '@/lib/vipps-login/vippsLoginOAuth'

const now = 1_788_000_000_000
const config: VippsLoginConfig = {
  apiBaseUrl: 'https://apitest.vipps.no',
  callbackUrl:
    'https://preview.utekos.no/api/identity/vipps/callback',
  clientId: 'test-client',
  clientSecret: 'test-secret',
  environment: 'test',
  issuer: new URL(
    'https://apitest.vipps.no/access-management-1.0/access/'
  ),
  redirectOrigin: 'https://preview.utekos.no',
  sessionKey: randomBytes(32)
}

function configuration() {
  return new oidc.Configuration(
    {
      authorization_endpoint:
        'https://apitest.vipps.no/access-management-1.0/access/oauth2/auth',
      code_challenge_methods_supported: ['S256'],
      id_token_signing_alg_values_supported: ['RS256'],
      issuer: config.issuer.href,
      jwks_uri:
        'https://apitest.vipps.no/access-management-1.0/access/.well-known/jwks.json',
      token_endpoint:
        'https://apitest.vipps.no/access-management-1.0/access/oauth2/token',
      userinfo_endpoint:
        'https://apitest.vipps.no/vipps-userinfo-api/userinfo'
    },
    config.clientId,
    undefined,
    oidc.ClientSecretBasic(config.clientSecret)
  )
}

function createOperations(
  overrides: Partial<VippsOidcOperations> = {}
): VippsOidcOperations {
  return {
    ClientSecretBasic: oidc.ClientSecretBasic,
    authorizationCodeGrant: oidc.authorizationCodeGrant,
    buildAuthorizationUrl: oidc.buildAuthorizationUrl,
    calculatePKCECodeChallenge: oidc.calculatePKCECodeChallenge,
    discovery: (async () =>
      configuration()) as typeof oidc.discovery,
    fetchUserInfo: oidc.fetchUserInfo,
    randomPKCECodeVerifier: oidc.randomPKCECodeVerifier,
    randomState: oidc.randomState,
    ...overrides
  }
}

test('builds the documented Vipps browser flow with state and PKCE S256', async () => {
  let discoveredIssuer: URL | undefined
  let discoveredClientId: string | undefined
  let clientSecret: string | undefined
  const operations = createOperations({
    ClientSecretBasic: secret => {
      clientSecret = secret
      return oidc.ClientSecretBasic(secret)
    },
    discovery: (async (issuer: URL, clientId: string) => {
      discoveredIssuer = issuer
      discoveredClientId = clientId
      return configuration()
    }) as typeof oidc.discovery
  })

  const result = await createVippsLoginAuthorization({
    config,
    now,
    operations,
    returnTo: '/produkter?fra=kurv'
  })

  assert.equal(discoveredIssuer?.href, config.issuer.href)
  assert.equal(discoveredClientId, config.clientId)
  assert.equal(clientSecret, config.clientSecret)
  assert.ok(result.context.state.length >= 8)
  assert.ok(result.context.codeVerifier.length >= 43)
  assert.equal(result.context.returnTo, '/produkter?fra=kurv')
  assert.equal(
    result.authorizationUrl.searchParams.get('response_type'),
    'code'
  )
  assert.equal(
    result.authorizationUrl.searchParams.get('redirect_uri'),
    config.callbackUrl
  )
  assert.equal(
    result.authorizationUrl.searchParams.get('scope'),
    'openid'
  )
  assert.equal(
    result.authorizationUrl.searchParams.get(
      'code_challenge_method'
    ),
    'S256'
  )
  assert.equal(
    result.authorizationUrl.searchParams.get('state'),
    result.context.state
  )
})

test('passes state, PKCE verifier and ID-token requirement to the certified client', async () => {
  const context = {
    codeVerifier: 'v'.repeat(64),
    issuedAt: now,
    returnTo: '/',
    state: 's'.repeat(32)
  }
  const callbackUrl = new URL(config.callbackUrl)
  callbackUrl.searchParams.set('code', 'single-use-code')
  callbackUrl.searchParams.set('state', context.state)
  let checks: oidc.AuthorizationCodeGrantChecks | undefined
  let expectedSubject: string | undefined

  const operations = createOperations({
    authorizationCodeGrant: (async (
      _configuration,
      _url,
      grantChecks
    ) => {
      checks = grantChecks
      return {
        access_token: 'user-access-token',
        claims: () => ({
          aud: config.clientId,
          exp: Math.floor(now / 1000) + 3600,
          iat: Math.floor(now / 1000),
          iss: config.issuer.href,
          sub: 'vipps-user-sub'
        }),
        token_type: 'bearer'
      } as Awaited<
        ReturnType<typeof oidc.authorizationCodeGrant>
      >
    }) as typeof oidc.authorizationCodeGrant,
    fetchUserInfo: (async (
      _configuration,
      _accessToken,
      subject
    ) => {
      expectedSubject = subject as string
      return { sub: 'vipps-user-sub' }
    }) as typeof oidc.fetchUserInfo
  })

  const result = await completeVippsLoginAuthorization({
    callbackUrl,
    config,
    context,
    now,
    operations
  })

  assert.equal(result.kind, 'connected')
  assert.equal(checks?.expectedState, context.state)
  assert.equal(checks?.pkceCodeVerifier, context.codeVerifier)
  assert.equal(checks?.idTokenExpected, true)
  assert.equal(expectedSubject, 'vipps-user-sub')
  if (result.kind === 'connected') {
    assert.equal(result.identity.sub, 'vipps-user-sub')
    assert.equal(result.identity.expiresAt, now + 3600 * 1000)
  }
})

test('rejects a mismatched or expired callback before token exchange', () => {
  const context = {
    codeVerifier: 'v'.repeat(64),
    issuedAt: now,
    returnTo: '/',
    state: 's'.repeat(32)
  }
  const mismatch = new URL(config.callbackUrl)
  mismatch.searchParams.set('code', 'single-use-code')
  mismatch.searchParams.set('state', 'different-state')

  assert.throws(
    () =>
      validateVippsLoginCallback({
        callbackUrl: mismatch,
        context,
        now
      }),
    /vipps_login_state_mismatch/u
  )
  assert.throws(
    () =>
      validateVippsLoginCallback({
        callbackUrl: new URL(
          `${config.callbackUrl}?code=x&state=${context.state}`
        ),
        context,
        now: now + 11 * 60 * 1000
      }),
    /vipps_login_state_expired/u
  )
})

test('handles provider cancellation and rejects external return URLs', () => {
  const context = {
    codeVerifier: 'v'.repeat(64),
    issuedAt: now,
    returnTo: '/',
    state: 's'.repeat(32)
  }
  const callbackUrl = new URL(config.callbackUrl)
  callbackUrl.searchParams.set('error', 'access_granted')
  callbackUrl.searchParams.set('state', context.state)

  assert.deepEqual(
    validateVippsLoginCallback({ callbackUrl, context, now }),
    { kind: 'cancelled' }
  )
  assert.equal(
    normalizeVippsLoginReturnTo(
      'https://example.com/phishing',
      config.redirectOrigin
    ),
    '/'
  )
})
