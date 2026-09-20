import type { NextRequest } from 'next/server'
import type { CookieSettings } from 'capi-param-builder-nodejs'
import * as z from '@/lib/validation/zodMini'
import { resolveTrackingAuthorization } from '@/lib/consent/resolveTrackingAuthorization'
import { ensureCanonicalMetaBrowserIds } from './ensureCanonicalMetaBrowserIds'

const observedValueSchema = z.string().check(z.maxLength(3000))
const cookieSchema = z.strictObject({
  name: z.enum(['_fbp', '_fbc']),
  value: z.string().check(z.minLength(1), z.maxLength(3800)),
  maxAge: z
    .number()
    .check(z.int(), z.minimum(1), z.maximum(7776000))
})

export function captureProxyMetaCookies(
  request: NextRequest
): CookieSettings[] {
  const fbclid = request.nextUrl.searchParams.get('fbclid')
  const fbp = request.cookies.get('_fbp')?.value
  const fbc = request.cookies.get('_fbc')?.value
  for (const value of [fbclid, fbp, fbc]) {
    if (
      value != null &&
      !observedValueSchema.safeParse(value).success
    ) {
      console.warn('[tracking] proxy_meta_capture_skipped', {
        reason: 'identifier_too_large'
      })
      return []
    }
  }

  try {
    const captured = ensureCanonicalMetaBrowserIds({
      browserId: {
        ...(fbp ? { fbp } : {}),
        ...(fbc ? { fbc } : {})
      },
      consent: resolveTrackingAuthorization(),
      pageUrl: request.url
    })
    const cookies = captured.cookiesToSet.map(cookie => {
      const parsed = cookieSchema.parse({
        name: cookie.name,
        value: cookie.value,
        maxAge: cookie.maxAge
      })
      if (encodeURIComponent(parsed.value).length > 3800) {
        throw new Error('cookie_too_large')
      }
      return { ...cookie, ...parsed }
    })

    for (const cookie of cookies) {
      request.cookies.set(cookie.name, cookie.value)
    }
    return cookies
  } catch {
    console.error('[tracking] proxy_meta_capture_failed')
    return []
  }
}
