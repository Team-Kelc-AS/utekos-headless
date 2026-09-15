import {
  CUSTOMER_AUTH_STATE_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  discoverCustomerAccountEndpoints,
  encryptCustomerAccountSession,
  getCustomerAccountConfig,
  hasCustomerAccountOAuthConfig,
  parseCustomerAccountTokenResponse,
  verifyCustomerAccountAuthState
} from '@/lib/shopify/customer-account/customerAccountAuth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const callbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1)
})

export async function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get('error')

  if (providerError) {
    return NextResponse.redirect(
      new URL(
        '/customer/account/login?error=cancelled',
        request.url
      )
    )
  }

  const query = callbackQuerySchema.safeParse({
    code: request.nextUrl.searchParams.get('code'),
    state: request.nextUrl.searchParams.get('state')
  })
  const config = getCustomerAccountConfig()

  if (!query.success || !hasCustomerAccountOAuthConfig(config)) {
    return NextResponse.redirect(
      new URL(
        '/customer/account/login?error=invalid_callback',
        request.url
      )
    )
  }

  const authCookie = request.cookies.get(
    CUSTOMER_AUTH_STATE_COOKIE
  )?.value
  const authState =
    authCookie ?
      verifyCustomerAccountAuthState(
        authCookie,
        config.sessionSecret
      )
    : null

  if (!authState || authState.state !== query.data.state) {
    return NextResponse.redirect(
      new URL(
        '/customer/account/login?error=invalid_state',
        request.url
      )
    )
  }

  try {
    const endpoints = await discoverCustomerAccountEndpoints(
      config.storeDomain
    )
    const callbackUrl = new URL(
      '/customer/account/callback',
      request.url
    ).toString()
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      redirect_uri: callbackUrl,
      code: query.data.code,
      code_verifier: authState.codeVerifier
    })
    const headers = new Headers({
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Utekos Headless Customer Account/1.0'
    })

    if (config.clientSecret) {
      headers.set(
        'Authorization',
        `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
      )
    }

    const tokenResponse = await fetch(endpoints.token_endpoint, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store'
    })

    if (!tokenResponse.ok) {
      throw new Error('Shopify token exchange failed')
    }

    const token = parseCustomerAccountTokenResponse(
      await tokenResponse.json()
    )
    const destination = new URL(authState.returnTo, request.url)
    destination.searchParams.set('account', 'connected')
    const response = NextResponse.redirect(destination)
    const encryptedSession = encryptCustomerAccountSession(
      token,
      config.sessionSecret
    )

    if (encryptedSession.length > 3800) {
      throw new Error(
        'Customer session cookie exceeds safe size'
      )
    }

    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      encryptedSession,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: token.expires_in
      }
    )
    response.cookies.delete(CUSTOMER_AUTH_STATE_COOKIE)

    return response
  } catch {
    const response = NextResponse.redirect(
      new URL(
        '/customer/account/login?error=shopify_auth_failed',
        request.url
      )
    )
    response.cookies.delete(CUSTOMER_AUTH_STATE_COOKIE)

    return response
  }
}
