import 'server-only'

import { createHash, timingSafeEqual } from 'node:crypto'
import * as oidc from 'openid-client'
import {
  VIPPS_LOGIN_IDENTITY_MAX_AGE_SECONDS,
  VIPPS_LOGIN_OAUTH_MAX_AGE_SECONDS,
  vippsLoginIdentitySchema,
  vippsLoginOAuthContextSchema,
  type VippsLoginOAuthContext
} from './vippsLoginContracts'
import type { VippsLoginConfig } from './vippsLoginConfig'

const DISCOVERY_CACHE_SECONDS = 60 * 60
const OIDC_TIMEOUT_SECONDS = 10

export type VippsOidcOperations = Pick<
  typeof oidc,
  | 'ClientSecretBasic'
  | 'authorizationCodeGrant'
  | 'buildAuthorizationUrl'
  | 'calculatePKCECodeChallenge'
  | 'discovery'
  | 'fetchUserInfo'
  | 'randomPKCECodeVerifier'
  | 'randomState'
>

const defaultOidcOperations: VippsOidcOperations = {
  ClientSecretBasic: oidc.ClientSecretBasic,
  authorizationCodeGrant: oidc.authorizationCodeGrant,
  buildAuthorizationUrl: oidc.buildAuthorizationUrl,
  calculatePKCECodeChallenge: oidc.calculatePKCECodeChallenge,
  discovery: oidc.discovery,
  fetchUserInfo: oidc.fetchUserInfo,
  randomPKCECodeVerifier: oidc.randomPKCECodeVerifier,
  randomState: oidc.randomState
}

let discoveryCache:
  | {
      expiresAt: number
      key: string
      value: Promise<oidc.Configuration>
    }
  | undefined

function discoveryCacheKey(config: VippsLoginConfig) {
  const credentialVersion = createHash('sha256')
    .update(config.clientSecret, 'utf8')
    .digest('base64url')
  return `${config.issuer.href}|${config.clientId}|${credentialVersion}`
}

function validateDiscoveredConfiguration(
  configuration: oidc.Configuration,
  expectedIssuer: URL
) {
  const metadata = configuration.serverMetadata()
  if (metadata.issuer !== expectedIssuer.href) {
    throw new Error('vipps_login_discovery_issuer_mismatch')
  }
  if (!metadata.supportsPKCE('S256')) {
    throw new Error('vipps_login_discovery_pkce_missing')
  }
  if (
    !metadata.id_token_signing_alg_values_supported?.includes(
      'RS256'
    )
  ) {
    throw new Error('vipps_login_discovery_rs256_missing')
  }
  if (
    !metadata.authorization_endpoint ||
    !metadata.token_endpoint ||
    !metadata.userinfo_endpoint ||
    !metadata.jwks_uri
  ) {
    throw new Error('vipps_login_discovery_incomplete')
  }
  return configuration
}

async function discoverVippsLoginConfiguration(input: {
  config: VippsLoginConfig
  now?: number
  operations?: VippsOidcOperations
}) {
  const operations = input.operations ?? defaultOidcOperations
  const now = input.now ?? Date.now()
  const key = discoveryCacheKey(input.config)

  if (
    operations === defaultOidcOperations &&
    discoveryCache?.key === key &&
    discoveryCache.expiresAt > now
  ) {
    return discoveryCache.value
  }

  const value = operations
    .discovery(
      input.config.issuer,
      input.config.clientId,
      undefined,
      operations.ClientSecretBasic(input.config.clientSecret)
    )
    .then(configuration => {
      configuration.timeout = OIDC_TIMEOUT_SECONDS
      return validateDiscoveredConfiguration(
        configuration,
        input.config.issuer
      )
    })

  if (operations === defaultOidcOperations) {
    discoveryCache = {
      expiresAt: now + DISCOVERY_CACHE_SECONDS * 1000,
      key,
      value
    }
    void value.catch(() => {
      if (discoveryCache?.value === value) {
        discoveryCache = undefined
      }
    })
  }

  return value
}

function stateMatches(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'utf8')
  const rightBuffer = Buffer.from(right, 'utf8')
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

export function normalizeVippsLoginReturnTo(
  value: string | null | undefined,
  origin: string
) {
  if (!value) return '/'

  try {
    const url = new URL(value, origin)
    if (url.origin !== origin) return '/'
    url.searchParams.delete('vipps_login')
    return vippsLoginOAuthContextSchema.shape.returnTo.parse(
      `${url.pathname}${url.search}${url.hash}`
    )
  } catch {
    return '/'
  }
}

export function resolveVippsLoginReturnTo(input: {
  origin: string
  referrer: string | null
  returnTo: string | null
}) {
  return normalizeVippsLoginReturnTo(
    input.returnTo || input.referrer,
    input.origin
  )
}

export function appendVippsLoginResult(
  origin: string,
  returnTo: string,
  result: 'connected' | 'cancelled' | 'error' | 'unavailable'
) {
  const url = new URL(
    normalizeVippsLoginReturnTo(returnTo, origin),
    origin
  )
  url.searchParams.set('vipps_login', result)
  return url
}

export async function createVippsLoginAuthorization(input: {
  config: VippsLoginConfig
  now?: number
  operations?: VippsOidcOperations
  returnTo: string
}) {
  const operations = input.operations ?? defaultOidcOperations
  const configuration = await discoverVippsLoginConfiguration({
    config: input.config,
    operations,
    ...(input.now === undefined ? {} : { now: input.now })
  })
  const state = operations.randomState()
  const codeVerifier = operations.randomPKCECodeVerifier()
  const codeChallenge =
    await operations.calculatePKCECodeChallenge(codeVerifier)
  const context = vippsLoginOAuthContextSchema.parse({
    codeVerifier,
    issuedAt: input.now ?? Date.now(),
    returnTo: normalizeVippsLoginReturnTo(
      input.returnTo,
      input.config.redirectOrigin
    ),
    state
  })

  const authorizationUrl = operations.buildAuthorizationUrl(
    configuration,
    {
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      market: 'NO',
      redirect_uri: input.config.callbackUrl,
      response_type: 'code',
      scope: 'openid',
      state
    }
  )

  return { authorizationUrl, context }
}

export function validateVippsLoginCallback(input: {
  callbackUrl: URL
  context: VippsLoginOAuthContext
  now?: number
}) {
  const now = input.now ?? Date.now()
  if (
    now - input.context.issuedAt >
      VIPPS_LOGIN_OAUTH_MAX_AGE_SECONDS * 1000 ||
    input.context.issuedAt > now + 30_000
  ) {
    throw new Error('vipps_login_state_expired')
  }

  const returnedState =
    input.callbackUrl.searchParams.get('state')
  if (
    !returnedState ||
    !stateMatches(returnedState, input.context.state)
  ) {
    throw new Error('vipps_login_state_mismatch')
  }

  const providerError =
    input.callbackUrl.searchParams.get('error')
  if (providerError) {
    return {
      kind:
        providerError === 'access_denied' ?
          ('cancelled' as const)
        : ('provider_error' as const)
    }
  }

  if (!input.callbackUrl.searchParams.get('code')) {
    throw new Error('vipps_login_code_missing')
  }

  return { kind: 'code' as const }
}

export async function completeVippsLoginAuthorization(input: {
  callbackUrl: URL
  config: VippsLoginConfig
  context: VippsLoginOAuthContext
  now?: number
  operations?: VippsOidcOperations
}) {
  const callback = validateVippsLoginCallback(input)
  if (callback.kind !== 'code') return callback

  const operations = input.operations ?? defaultOidcOperations
  const configuration = await discoverVippsLoginConfiguration({
    config: input.config,
    operations,
    ...(input.now === undefined ? {} : { now: input.now })
  })
  const tokens = await operations.authorizationCodeGrant(
    configuration,
    input.callbackUrl,
    {
      expectedState: input.context.state,
      idTokenExpected: true,
      pkceCodeVerifier: input.context.codeVerifier
    }
  )
  const claims = tokens.claims()
  if (!claims?.sub || !claims.exp) {
    throw new Error('vipps_login_id_token_claims_invalid')
  }

  const userInfo = await operations.fetchUserInfo(
    configuration,
    tokens.access_token,
    claims.sub
  )
  if (userInfo.sub !== claims.sub) {
    throw new Error('vipps_login_userinfo_subject_mismatch')
  }

  const authenticatedAt = input.now ?? Date.now()
  const expiresAt = Math.min(
    claims.exp * 1000,
    authenticatedAt + VIPPS_LOGIN_IDENTITY_MAX_AGE_SECONDS * 1000
  )
  if (expiresAt <= authenticatedAt) {
    throw new Error('vipps_login_identity_expired')
  }

  return {
    identity: vippsLoginIdentitySchema.parse({
      authenticatedAt,
      expiresAt,
      issuer: input.config.issuer.href,
      sub: claims.sub
    }),
    kind: 'connected' as const
  }
}
