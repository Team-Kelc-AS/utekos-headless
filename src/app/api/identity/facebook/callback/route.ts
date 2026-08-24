import { timingSafeEqual } from 'node:crypto'
import {
  connection,
  NextRequest,
  NextResponse
} from 'next/server'
import {
  FACEBOOK_LOGIN_IDENTITY_COOKIE,
  FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS,
  FACEBOOK_LOGIN_OAUTH_COOKIE,
  FACEBOOK_LOGIN_OAUTH_MAX_AGE_SECONDS,
  facebookLoginOAuthContextSchema,
  type FacebookLoginOAuthContext
} from '@/lib/facebook-login/facebookLoginContracts'
import { readFacebookLoginConfig } from '@/lib/facebook-login/facebookLoginConfig'
import {
  decryptFacebookLoginJson,
  encryptFacebookLoginJson
} from '@/lib/facebook-login/facebookLoginCrypto'
import {
  appendFacebookLoginResult,
  exchangeFacebookLoginCode
} from '@/lib/facebook-login/facebookLoginOAuth'
import { protectFacebookLoginContact } from '@/lib/facebook-login/protectFacebookLoginContact'
import { upsertFacebookLoginIdentity } from '@/lib/facebook-login/postgresFacebookLoginIdentityStore'

function sameState(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'utf8')
  const rightBuffer = Buffer.from(right, 'utf8')
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

function clearOAuthCookie(
  response: NextResponse,
  secure: boolean
) {
  response.cookies.set(FACEBOOK_LOGIN_OAUTH_COOKIE, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure
  })
}

function errorCode(error: unknown) {
  return (
      error instanceof Error &&
        /^facebook_login_[a-z0-9_]+$/u.test(error.message)
    ) ?
      error.message
    : 'facebook_login_callback_failed'
}

export async function GET(request: NextRequest) {
  await connection()

  let context: FacebookLoginOAuthContext | undefined

  try {
    const config = readFacebookLoginConfig()
    const stateCookie = request.cookies.get(
      FACEBOOK_LOGIN_OAUTH_COOKIE
    )?.value

    if (!stateCookie) {
      throw new Error('facebook_login_state_missing')
    }

    context = decryptFacebookLoginJson(
      stateCookie,
      'oauth-state',
      config.identityKey,
      facebookLoginOAuthContextSchema
    )

    if (
      Date.now() - context.issuedAt >
      FACEBOOK_LOGIN_OAUTH_MAX_AGE_SECONDS * 1000
    ) {
      throw new Error('facebook_login_state_expired')
    }

    const returnedState =
      request.nextUrl.searchParams.get('state')
    if (
      !returnedState ||
      !sameState(returnedState, context.state)
    ) {
      throw new Error('facebook_login_state_mismatch')
    }

    if (request.nextUrl.searchParams.get('error')) {
      const response = NextResponse.redirect(
        appendFacebookLoginResult(
          config.redirectOrigin,
          context.returnTo,
          'error'
        ),
        302
      )
      clearOAuthCookie(
        response,
        config.redirectOrigin.startsWith('https://')
      )
      return response
    }

    const code = request.nextUrl.searchParams.get('code')
    if (!code) {
      throw new Error('facebook_login_code_missing')
    }

    const identity = await exchangeFacebookLoginCode({
      code,
      config
    })
    const protectedEmail =
      identity.email ?
        protectFacebookLoginContact(
          identity.email,
          config.identityKey
        )
      : undefined

    if (protectedEmail && protectedEmail.kind !== 'email') {
      throw new Error('facebook_login_email_invalid')
    }

    const stored = await upsertFacebookLoginIdentity({
      appId: config.appId,
      emailPermissionGranted: identity.emailPermissionGranted,
      externalId: context.externalId,
      facebookLoginId: identity.facebookLoginId,
      ...(context.attribution ?
        { attribution: context.attribution }
      : {}),
      ...(context.fbc ? { fbc: context.fbc } : {}),
      ...(context.fbclid ? { fbclid: context.fbclid } : {}),
      ...(protectedEmail ?
        {
          emailCiphertext: protectedEmail.ciphertext,
          emailSha256: protectedEmail.sha256
        }
      : {})
    })

    const expiresAt =
      Date.now() + FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS * 1000
    const identityCookie = encryptFacebookLoginJson(
      {
        identityId: stored.id,
        facebookLoginId: identity.facebookLoginId,
        externalId: context.externalId,
        expiresAt,
        ...(context.fbc ? { fbc: context.fbc } : {}),
        ...(context.fbclid ? { fbclid: context.fbclid } : {}),
        ...(protectedEmail ?
          { emailSha256: protectedEmail.sha256 }
        : {})
      },
      'identity-cookie',
      config.identityKey
    )
    const result = protectedEmail ? 'connected' : 'needs_contact'
    const response = NextResponse.redirect(
      appendFacebookLoginResult(
        config.redirectOrigin,
        context.returnTo,
        result
      ),
      302
    )

    response.headers.set('Cache-Control', 'no-store, max-age=0')
    response.cookies.set(
      FACEBOOK_LOGIN_IDENTITY_COOKIE,
      identityCookie,
      {
        httpOnly: true,
        maxAge: FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS,
        path: '/',
        sameSite: 'lax',
        secure: config.redirectOrigin.startsWith('https://')
      }
    )
    clearOAuthCookie(
      response,
      config.redirectOrigin.startsWith('https://')
    )
    return response
  } catch (error) {
    const code = errorCode(error)
    console.error('[facebook-login] callback failed', { code })

    let origin = 'https://utekos.no'
    try {
      origin = readFacebookLoginConfig().redirectOrigin
    } catch {}

    const response = NextResponse.redirect(
      appendFacebookLoginResult(
        origin,
        context?.returnTo ?? '/',
        'error'
      ),
      302
    )
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    clearOAuthCookie(response, origin.startsWith('https://'))
    return response
  }
}
