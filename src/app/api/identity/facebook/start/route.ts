import {
  connection,
  NextRequest,
  NextResponse
} from 'next/server'
import {
  FACEBOOK_LOGIN_OAUTH_COOKIE,
  FACEBOOK_LOGIN_OAUTH_MAX_AGE_SECONDS
} from '@/lib/facebook-login/facebookLoginContracts'
import { readFacebookLoginRequestConfig } from '@/lib/facebook-login/readFacebookLoginRequestConfig'
import { encryptFacebookLoginJson } from '@/lib/facebook-login/facebookLoginCrypto'
import {
  buildFacebookLoginDialogUrl,
  createFacebookLoginOAuthContext
} from '@/lib/facebook-login/facebookLoginOAuth'

export async function GET(request: NextRequest) {
  await connection()

  try {
    const config = readFacebookLoginRequestConfig(request)
    const context = createFacebookLoginOAuthContext({
      cookieHeader: request.headers.get('cookie') ?? undefined,
      origin: request.nextUrl.origin,
      returnTo: request.nextUrl.searchParams.get('return_to')
    })
    const stateCookie = encryptFacebookLoginJson(
      context,
      'oauth-state',
      config.identityKey
    )
    const response = NextResponse.redirect(
      buildFacebookLoginDialogUrl(config, context),
      302
    )

    response.headers.set('Cache-Control', 'no-store, max-age=0')
    response.cookies.set(
      FACEBOOK_LOGIN_OAUTH_COOKIE,
      stateCookie,
      {
        httpOnly: true,
        maxAge: FACEBOOK_LOGIN_OAUTH_MAX_AGE_SECONDS,
        path: '/',
        sameSite: 'lax',
        secure: config.redirectOrigin.startsWith('https://')
      }
    )

    return response
  } catch {
    return Response.json(
      { error: 'facebook_login_unavailable' },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
        status: 503
      }
    )
  }
}
