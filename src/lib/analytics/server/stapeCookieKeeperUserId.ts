import type { NextRequest, NextResponse } from 'next/server'

export const COOKIE_KEEPER_USER_ID_COOKIE = 'user_id'

/** Stape Cookie Keeper master-cookie lifetime requirement. */
export const COOKIE_KEEPER_USER_ID_MAX_AGE_SECONDS =
  60 * 60 * 24 * 400

const COOKIE_KEEPER_USER_ID_PATTERN = /^[0-9a-f]{32}$/i

export function isValidCookieKeeperUserId(
  value: string | undefined | null
): value is string {
  return (
    typeof value === 'string' &&
    COOKIE_KEEPER_USER_ID_PATTERN.test(value)
  )
}

export function createCookieKeeperUserId(
  createId: () => string = () => crypto.randomUUID()
): string {
  const value = createId().replaceAll('-', '')
  if (!isValidCookieKeeperUserId(value)) {
    throw new Error('Failed to create Cookie Keeper user_id')
  }
  return value
}

export function resolveCookieKeeperUserId(
  existing: string | undefined | null,
  createId?: () => string
): string {
  if (isValidCookieKeeperUserId(existing)) {
    return existing
  }
  return createCookieKeeperUserId(createId)
}

function cookieDomainForHost(
  hostname: string
): string | undefined {
  if (hostname === 'utekos.no' || hostname.endsWith('.utekos.no')) {
    return 'utekos.no'
  }
  return undefined
}

/**
 * Ensures the Stape Cookie Keeper master cookie exists and refreshes
 * Max-Age. Never changes an already-valid value.
 */
export function applyCookieKeeperUserIdCookie(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const existing = request.cookies.get(
    COOKIE_KEEPER_USER_ID_COOKIE
  )?.value
  const value = resolveCookieKeeperUserId(existing)
  const domain = cookieDomainForHost(request.nextUrl.hostname)

  response.cookies.set(COOKIE_KEEPER_USER_ID_COOKIE, value, {
    ...(domain ? { domain } : {}),
    httpOnly: false,
    maxAge: COOKIE_KEEPER_USER_ID_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:'
  })
  response.headers.set(
    'Cache-Control',
    'private, no-store, max-age=0'
  )
  return response
}
