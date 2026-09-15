import {
  CUSTOMER_AUTH_STATE_COOKIE,
  createCustomerAccountAuthState,
  discoverCustomerAccountEndpoints,
  getCustomerAccountConfig,
  getHostedCustomerAccountLoginUrl,
  hasCustomerAccountOAuthConfig,
  normalizeCustomerReturnTo,
  signCustomerAccountAuthState
} from '@/lib/shopify/customer-account/customerAccountAuth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const authorizeQuerySchema = z.object({
  email: z.string().trim().email().optional(),
  mode: z.enum(['login', 'create']).catch('login'),
  returnTo: z.string().optional()
})

export async function GET(request: NextRequest) {
  const query = authorizeQuerySchema.safeParse({
    email:
      request.nextUrl.searchParams.get('email') || undefined,
    mode: request.nextUrl.searchParams.get('mode') || undefined,
    returnTo:
      request.nextUrl.searchParams.get('returnTo') || undefined
  })

  if (!query.success) {
    return NextResponse.redirect(
      new URL(
        '/customer/account/login?error=invalid_input',
        request.url
      )
    )
  }

  const config = getCustomerAccountConfig()

  if (!hasCustomerAccountOAuthConfig(config)) {
    return NextResponse.redirect(
      getHostedCustomerAccountLoginUrl(config.customerAccountUrl)
    )
  }

  try {
    const endpoints = await discoverCustomerAccountEndpoints(
      config.storeDomain
    )
    const returnTo = normalizeCustomerReturnTo(
      query.data.returnTo
    )
    const authState = createCustomerAccountAuthState(returnTo)
    const callbackUrl = new URL(
      '/customer/account/callback',
      request.url
    ).toString()
    const authorizationUrl = new URL(
      endpoints.authorization_endpoint
    )

    authorizationUrl.searchParams.set(
      'scope',
      'openid email customer-account-api:full'
    )
    authorizationUrl.searchParams.set(
      'client_id',
      config.clientId
    )
    authorizationUrl.searchParams.set('response_type', 'code')
    authorizationUrl.searchParams.set(
      'redirect_uri',
      callbackUrl
    )
    authorizationUrl.searchParams.set('state', authState.state)
    authorizationUrl.searchParams.set('nonce', authState.nonce)
    authorizationUrl.searchParams.set(
      'code_challenge',
      authState.codeChallenge
    )
    authorizationUrl.searchParams.set(
      'code_challenge_method',
      'S256'
    )
    authorizationUrl.searchParams.set('locale', 'nb')
    authorizationUrl.searchParams.set('region_country', 'NO')

    if (query.data.email) {
      authorizationUrl.searchParams.set(
        'login_hint',
        query.data.email
      )
    }

    const response = NextResponse.redirect(authorizationUrl)
    response.cookies.set(
      CUSTOMER_AUTH_STATE_COOKIE,
      signCustomerAccountAuthState(
        authState,
        config.sessionSecret
      ),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/customer/account',
        maxAge: 10 * 60
      }
    )

    return response
  } catch {
    return NextResponse.redirect(
      new URL(
        '/customer/account/login?error=shopify_unavailable',
        request.url
      )
    )
  }
}
