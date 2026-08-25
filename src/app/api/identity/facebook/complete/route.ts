import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  FACEBOOK_LOGIN_IDENTITY_COOKIE,
  FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS,
  FACEBOOK_LOGIN_OAUTH_COOKIE,
  FACEBOOK_LOGIN_OAUTH_MAX_AGE_SECONDS,
  facebookLoginOAuthContextSchema
} from '@/lib/facebook-login/facebookLoginContracts'
import { readFacebookLoginRequestConfig } from '@/lib/facebook-login/readFacebookLoginRequestConfig'
import { decryptFacebookLoginJson } from '@/lib/facebook-login/facebookLoginCrypto'
import { finalizeFacebookLoginIdentity } from '@/lib/facebook-login/finalizeFacebookLoginIdentity'
import { isSameOriginFacebookLoginRequest } from '@/lib/facebook-login/isSameOriginFacebookLoginRequest'
import { validateFacebookLoginAccessToken } from '@/lib/facebook-login/facebookLoginOAuth'

const completeSchema = z.strictObject({
  accessToken: z.string().min(20).max(4096),
  userID: z.string().regex(/^\d+$/u).max(64)
})

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0'
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

export async function POST(request: NextRequest) {
  if (!isSameOriginFacebookLoginRequest(request)) {
    return Response.json(
      { error: 'forbidden_origin' },
      { headers: NO_STORE_HEADERS, status: 403 }
    )
  }

  let body: z.infer<typeof completeSchema>
  try {
    body = completeSchema.parse(await request.json())
  } catch {
    return Response.json(
      { error: 'facebook_login_complete_invalid' },
      { headers: NO_STORE_HEADERS, status: 400 }
    )
  }

  try {
    const config = readFacebookLoginRequestConfig(request)
    const stateCookie = request.cookies.get(
      FACEBOOK_LOGIN_OAUTH_COOKIE
    )?.value
    if (!stateCookie) {
      throw new Error('facebook_login_state_missing')
    }

    const context = decryptFacebookLoginJson(
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

    const identity = await validateFacebookLoginAccessToken({
      accessToken: body.accessToken,
      config,
      expectedUserId: body.userID
    })
    const { identityCookie, result } =
      await finalizeFacebookLoginIdentity({
        config,
        context,
        identity
      })
    const response = NextResponse.json(
      { status: result },
      { headers: NO_STORE_HEADERS }
    )

    response.cookies.set(
      FACEBOOK_LOGIN_IDENTITY_COOKIE,
      identityCookie,
      {
        httpOnly: true,
        maxAge: FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS,
        path: '/',
        sameSite: 'lax',
        secure: request.nextUrl.protocol === 'https:'
      }
    )
    clearOAuthCookie(
      response,
      request.nextUrl.protocol === 'https:'
    )
    return response
  } catch (error) {
    const code =
      error instanceof Error ?
        error.message
      : 'facebook_login_complete_failed'
    const authenticationFailure = [
      'facebook_login_state_missing',
      'facebook_login_state_expired',
      'facebook_login_graph_rejected',
      'facebook_login_token_identity_invalid',
      'facebook_login_profile_identity_mismatch'
    ].includes(code)
    console.error('[facebook-login] SDK completion failed', {
      code:
        /^facebook_login_[a-z0-9_]+$/u.test(code) ? code : (
          'facebook_login_complete_failed'
        )
    })
    const response = NextResponse.json(
      { error: 'facebook_login_complete_failed' },
      {
        headers: NO_STORE_HEADERS,
        status: authenticationFailure ? 401 : 503
      }
    )
    if (authenticationFailure) {
      clearOAuthCookie(
        response,
        request.nextUrl.protocol === 'https:'
      )
    }
    return response
  }
}
