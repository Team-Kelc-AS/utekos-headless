import { NextRequest, NextResponse } from 'next/server'
import {
  VIPPS_LOGIN_OAUTH_COOKIE,
  VIPPS_LOGIN_OAUTH_MAX_AGE_SECONDS,
  type VippsLoginOAuthContext
} from '@/lib/vipps-login/vippsLoginContracts'
import {
  readVippsLoginConfig,
  type VippsLoginConfig
} from '@/lib/vipps-login/vippsLoginConfig'
import { encryptVippsLoginJson } from '@/lib/vipps-login/vippsLoginCrypto'
import {
  appendVippsLoginResult,
  createVippsLoginAuthorization,
  resolveVippsLoginReturnTo
} from '@/lib/vipps-login/vippsLoginOAuth'

type StartDependencies = {
  createAuthorization: (input: {
    config: VippsLoginConfig
    returnTo: string
  }) => Promise<{
    authorizationUrl: URL
    context: VippsLoginOAuthContext
  }>
  encryptContext: (
    context: VippsLoginOAuthContext,
    config: VippsLoginConfig
  ) => string
  readConfig: () => VippsLoginConfig
}

const defaultDependencies: StartDependencies = {
  createAuthorization: createVippsLoginAuthorization,
  encryptContext: (context, config) =>
    encryptVippsLoginJson(
      context,
      'oauth-state',
      config.sessionKey
    ),
  readConfig: readVippsLoginConfig
}

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  return response
}

export async function handleVippsLoginStart(
  request: NextRequest,
  dependencies: StartDependencies = defaultDependencies
) {
  const requestedReturnTo =
    request.nextUrl.searchParams.get('return_to')
  const referrer = request.headers.get('referer')

  try {
    const config = dependencies.readConfig()
    const returnTo = resolveVippsLoginReturnTo({
      origin: config.redirectOrigin,
      referrer,
      returnTo: requestedReturnTo
    })
    const { authorizationUrl, context } =
      await dependencies.createAuthorization({
        config,
        returnTo
      })
    const response = noStore(
      NextResponse.redirect(authorizationUrl, 302)
    )

    response.cookies.set(
      VIPPS_LOGIN_OAUTH_COOKIE,
      dependencies.encryptContext(context, config),
      {
        httpOnly: true,
        maxAge: VIPPS_LOGIN_OAUTH_MAX_AGE_SECONDS,
        path: '/api/identity/vipps',
        sameSite: 'lax',
        secure: config.redirectOrigin.startsWith('https://')
      }
    )

    return response
  } catch {
    const returnTo = resolveVippsLoginReturnTo({
      origin: request.nextUrl.origin,
      referrer,
      returnTo: requestedReturnTo
    })
    return noStore(
      NextResponse.redirect(
        appendVippsLoginResult(
          request.nextUrl.origin,
          returnTo,
          'unavailable'
        ),
        302
      )
    )
  }
}

export async function GET(request: NextRequest) {
  return handleVippsLoginStart(request)
}
