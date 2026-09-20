import type { CookieSettings } from 'capi-param-builder-nodejs'
import type { NextRequest, NextResponse } from 'next/server'

export function applyProxyMetaCookies(
  response: NextResponse,
  request: NextRequest,
  cookies: CookieSettings[]
): NextResponse {
  if (cookies.length === 0) return response
  const hostname = request.nextUrl.hostname
  const domain =
    hostname === 'utekos.no' || hostname.endsWith('.utekos.no') ?
      'utekos.no'
    : undefined

  for (const cookie of cookies) {
    response.cookies.set(cookie.name, cookie.value, {
      ...(domain ? { domain } : {}),
      httpOnly: false,
      maxAge: cookie.maxAge,
      path: '/',
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:'
    })
  }
  response.headers.set(
    'Cache-Control',
    'private, no-store, max-age=0'
  )
  return response
}
