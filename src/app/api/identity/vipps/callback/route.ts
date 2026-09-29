import { NextRequest, NextResponse } from 'next/server'
import {
  VIPPS_LOGIN_IDENTITY_COOKIE,
  VIPPS_LOGIN_IDENTITY_MAX_AGE_SECONDS,
  VIPPS_LOGIN_OAUTH_COOKIE,
  vippsLoginIdentitySchema,
  vippsLoginOAuthContextSchema,
  type VippsLoginIdentity,
  type VippsLoginOAuthContext
} from '@/lib/vipps-login/vippsLoginContracts'
import {
  readVippsLoginConfig,
  type VippsLoginConfig
} from '@/lib/vipps-login/vippsLoginConfig'
import {
  decryptVippsLoginJson,
  encryptVippsLoginJson
} from '@/lib/vipps-login/vippsLoginCrypto'
import {
  appendVippsLoginResult,
  completeVippsLoginAuthorization
} from '@/lib/vipps-login/vippsLoginOAuth'

type CompletionResult = Awaited<
  ReturnType<typeof completeVippsLoginAuthorization>
>

type CallbackDependencies = {
  completeAuthorization: (input: {
    callbackUrl: URL
    config: VippsLoginConfig
    context: VippsLoginOAuthContext
  }) => Promise<CompletionResult>
  decryptContext: (
    token: string,
    config: VippsLoginConfig
  ) => VippsLoginOAuthContext
  encryptIdentity: (
    identity: VippsLoginIdentity,
    config: VippsLoginConfig
  ) => string
  now: () => number
  readConfig: () => VippsLoginConfig
}

const defaultDependencies: CallbackDependencies = {
  completeAuthorization: completeVippsLoginAuthorization,
  decryptContext: (token, config) =>
    decryptVippsLoginJson(
      token,
      'oauth-state',
      config.sessionKey,
      vippsLoginOAuthContextSchema
    ),
  encryptIdentity: (identity, config) =>
    encryptVippsLoginJson(
      vippsLoginIdentitySchema.parse(identity),
      'identity-cookie',
      config.sessionKey
    ),
  now: Date.now,
  readConfig: readVippsLoginConfig
}

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  return response
}

function clearOAuthCookie(
  response: NextResponse,
  secure: boolean
) {
  response.cookies.set(VIPPS_LOGIN_OAUTH_COOKIE, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/api/identity/vipps',
    sameSite: 'lax',
    secure
  })
}

function callbackErrorCode(error: unknown) {
  return (
      error instanceof Error &&
        /^vipps_login_[a-z0-9_]+$/u.test(error.message)
    ) ?
      error.message
    : 'vipps_login_callback_failed'
}

export async function handleVippsLoginCallback(
  request: NextRequest,
  dependencies: CallbackDependencies = defaultDependencies
) {
  let config: VippsLoginConfig | undefined
  let context: VippsLoginOAuthContext | undefined

  try {
    config = dependencies.readConfig()
    const stateCookie = request.cookies.get(
      VIPPS_LOGIN_OAUTH_COOKIE
    )?.value
    if (!stateCookie) {
      throw new Error('vipps_login_state_missing')
    }

    context = dependencies.decryptContext(stateCookie, config)
    const completion = await dependencies.completeAuthorization({
      callbackUrl: request.nextUrl,
      config,
      context
    })
    const result =
      completion.kind === 'connected' ? 'connected'
      : completion.kind === 'cancelled' ? 'cancelled'
      : 'error'
    const response = noStore(
      NextResponse.redirect(
        appendVippsLoginResult(
          config.redirectOrigin,
          context.returnTo,
          result
        ),
        302
      )
    )

    if (completion.kind === 'connected') {
      const maxAge = Math.min(
        VIPPS_LOGIN_IDENTITY_MAX_AGE_SECONDS,
        Math.max(
          1,
          Math.floor(
            (completion.identity.expiresAt -
              dependencies.now()) /
              1000
          )
        )
      )
      response.cookies.set(
        VIPPS_LOGIN_IDENTITY_COOKIE,
        dependencies.encryptIdentity(
          completion.identity,
          config
        ),
        {
          httpOnly: true,
          maxAge,
          path: '/',
          sameSite: 'lax',
          secure: config.redirectOrigin.startsWith('https://')
        }
      )
    }

    clearOAuthCookie(
      response,
      config.redirectOrigin.startsWith('https://')
    )
    return response
  } catch (error) {
    console.error('[vipps-login] callback failed', {
      code: callbackErrorCode(error)
    })

    const origin =
      config?.redirectOrigin ?? request.nextUrl.origin
    const response = noStore(
      NextResponse.redirect(
        appendVippsLoginResult(
          origin,
          context?.returnTo ?? '/',
          'error'
        ),
        302
      )
    )
    clearOAuthCookie(response, origin.startsWith('https://'))
    return response
  }
}

export async function GET(request: NextRequest) {
  return handleVippsLoginCallback(request)
}
