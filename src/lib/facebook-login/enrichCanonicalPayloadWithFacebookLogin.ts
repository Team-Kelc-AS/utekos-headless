import 'server-only'

import { readFacebookLoginConfig } from './facebookLoginConfig'
import { readFacebookLoginIdentityCookie } from './facebookLoginCookie'

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

function mergeHashes(
  existing: unknown,
  value: string | undefined
) {
  const hashes =
    Array.isArray(existing) ?
      existing.filter(
        candidate =>
          typeof candidate === 'string' &&
          /^[a-f0-9]{64}$/u.test(candidate)
      )
    : []

  if (value && !hashes.includes(value)) hashes.push(value)
  return hashes.length > 0 ? hashes : undefined
}

export function enrichCanonicalPayloadWithFacebookLogin(
  payload: unknown,
  cookieHeader: string | undefined,
  environment: Readonly<
    Record<string, string | undefined>
  > = process.env
): unknown {
  if (!isRecord(payload) || !isRecord(payload.consent)) {
    return payload
  }
  if (payload.consent.marketing !== 'granted') return payload

  try {
    const config = readFacebookLoginConfig(environment)
    const identity = readFacebookLoginIdentityCookie({
      cookieHeader,
      identityKey: config.identityKey
    })
    if (!identity) return payload

    const existingUserData =
      isRecord(payload.user_data) ? payload.user_data : {}
    const existingBrowserId =
      isRecord(payload.browser_id) ? payload.browser_id : {}
    const existingClickId =
      isRecord(payload.click_id) ? payload.click_id : {}
    const emailSha256 = mergeHashes(
      existingUserData.email_sha256,
      identity.emailSha256
    )
    const phoneSha256 = mergeHashes(
      existingUserData.phone_sha256,
      identity.phoneSha256
    )

    return {
      ...payload,
      external_id: payload.external_id ?? identity.externalId,
      user_data: {
        ...existingUserData,
        facebook_login_id: identity.facebookLoginId,
        ...(emailSha256 ? { email_sha256: emailSha256 } : {}),
        ...(phoneSha256 ? { phone_sha256: phoneSha256 } : {})
      },
      ...(identity.fbc ?
        {
          browser_id: {
            ...existingBrowserId,
            fbc: existingBrowserId.fbc ?? identity.fbc
          }
        }
      : Object.keys(existingBrowserId).length > 0 ?
        { browser_id: existingBrowserId }
      : {}),
      ...(identity.fbclid ?
        {
          click_id: {
            ...existingClickId,
            fbclid: existingClickId.fbclid ?? identity.fbclid
          }
        }
      : Object.keys(existingClickId).length > 0 ?
        { click_id: existingClickId }
      : {})
    }
  } catch {
    // Identity enrichment must never interrupt the canonical event path.
    return payload
  }
}
