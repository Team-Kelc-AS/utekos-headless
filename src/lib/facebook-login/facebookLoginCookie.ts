import 'server-only'

import {
  FACEBOOK_LOGIN_IDENTITY_COOKIE,
  facebookLoginIdentityCookieSchema,
  type FacebookLoginIdentityCookie
} from './facebookLoginContracts'
import { decryptFacebookLoginJson } from './facebookLoginCrypto'

function readCookie(cookieHeader: string, name: string) {
  const prefix = `${name}=`
  for (const part of cookieHeader.split(';')) {
    const candidate = part.trim()
    if (!candidate.startsWith(prefix)) continue

    try {
      return decodeURIComponent(candidate.slice(prefix.length))
    } catch {
      return undefined
    }
  }
  return undefined
}

export function readFacebookLoginIdentityCookie(input: {
  cookieHeader: string | undefined
  identityKey: Buffer
  now?: number
}): FacebookLoginIdentityCookie | undefined {
  const token = readCookie(
    input.cookieHeader ?? '',
    FACEBOOK_LOGIN_IDENTITY_COOKIE
  )
  if (!token) return undefined

  try {
    const identity = decryptFacebookLoginJson(
      token,
      'identity-cookie',
      input.identityKey,
      facebookLoginIdentityCookieSchema
    )

    if (identity.expiresAt <= (input.now ?? Date.now())) {
      return undefined
    }

    return identity
  } catch {
    return undefined
  }
}
