import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  FACEBOOK_LOGIN_OAUTH_COOKIE,
  FACEBOOK_LOGIN_OAUTH_MAX_AGE_SECONDS
} from '@/lib/facebook-login/facebookLoginContracts'
import { readFacebookLoginRequestConfig } from '@/lib/facebook-login/readFacebookLoginRequestConfig'
import { encryptFacebookLoginJson } from '@/lib/facebook-login/facebookLoginCrypto'
import { createFacebookLoginOAuthContext } from '@/lib/facebook-login/facebookLoginOAuth'
import { isSameOriginFacebookLoginRequest } from '@/lib/facebook-login/isSameOriginFacebookLoginRequest'

const prepareSchema = z.strictObject({
  returnTo: z.string().min(1).max(2048)
})

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0'
}

export async function POST(request: NextRequest) {
  if (!isSameOriginFacebookLoginRequest(request)) {
    return Response.json(
      { error: 'forbidden_origin' },
      { headers: NO_STORE_HEADERS, status: 403 }
    )
  }

  try {
    const config = readFacebookLoginRequestConfig(request)
    const body = prepareSchema.parse(await request.json())
    const context = createFacebookLoginOAuthContext({
      cookieHeader: request.headers.get('cookie') ?? undefined,
      origin: request.nextUrl.origin,
      returnTo: body.returnTo
    })
    const stateCookie = encryptFacebookLoginJson(
      context,
      'oauth-state',
      config.identityKey
    )
    const response = NextResponse.json(
      { status: 'ready' },
      { headers: NO_STORE_HEADERS }
    )

    response.cookies.set(
      FACEBOOK_LOGIN_OAUTH_COOKIE,
      stateCookie,
      {
        httpOnly: true,
        maxAge: FACEBOOK_LOGIN_OAUTH_MAX_AGE_SECONDS,
        path: '/',
        sameSite: 'lax',
        secure: request.nextUrl.protocol === 'https:'
      }
    )

    return response
  } catch (error) {
    const invalid = error instanceof z.ZodError
    return Response.json(
      {
        error:
          invalid ?
            'facebook_login_prepare_invalid'
          : 'facebook_login_unavailable'
      },
      { headers: NO_STORE_HEADERS, status: invalid ? 400 : 503 }
    )
  }
}
