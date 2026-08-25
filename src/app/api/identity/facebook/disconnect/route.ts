import { NextRequest, NextResponse } from 'next/server'
import {
  FACEBOOK_LOGIN_IDENTITY_COOKIE,
  FACEBOOK_LOGIN_OAUTH_COOKIE
} from '@/lib/facebook-login/facebookLoginContracts'
import { readFacebookLoginIdentityCookie } from '@/lib/facebook-login/facebookLoginCookie'
import { readFacebookLoginRequestConfig } from '@/lib/facebook-login/readFacebookLoginRequestConfig'
import { isSameOriginFacebookLoginRequest } from '@/lib/facebook-login/isSameOriginFacebookLoginRequest'
import { deleteFacebookLoginIdentity } from '@/lib/facebook-login/postgresFacebookLoginIdentityStore'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0'
}

function clearFacebookLoginCookies(
  response: NextResponse,
  secure: boolean
) {
  for (const name of [
    FACEBOOK_LOGIN_IDENTITY_COOKIE,
    FACEBOOK_LOGIN_OAUTH_COOKIE
  ]) {
    response.cookies.set(name, '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      secure
    })
  }
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
    const identity = readFacebookLoginIdentityCookie({
      cookieHeader: request.headers.get('cookie') ?? undefined,
      identityKey: config.identityKey
    })

    if (identity) {
      await deleteFacebookLoginIdentity({
        appId: config.appId,
        identityId: identity.identityId
      })
    }

    const response = NextResponse.json(
      { status: 'disconnected' },
      { headers: NO_STORE_HEADERS }
    )
    clearFacebookLoginCookies(
      response,
      request.nextUrl.protocol === 'https:'
    )
    return response
  } catch {
    return Response.json(
      { error: 'facebook_login_disconnect_failed' },
      { headers: NO_STORE_HEADERS, status: 500 }
    )
  }
}
