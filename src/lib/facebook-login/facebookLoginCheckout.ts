import 'server-only'

import {
  FACEBOOK_EMAIL_SHA256_ATTRIBUTE,
  FACEBOOK_LOGIN_ID_ATTRIBUTE,
  FACEBOOK_PHONE_SHA256_ATTRIBUTE,
  checkoutAttributionSnapshotSchema,
  type CheckoutAttributionSnapshot
} from '@/lib/analytics/checkoutAttributionSnapshot'
import { readFacebookLoginConfig } from './facebookLoginConfig'
import { readFacebookLoginIdentityCookie } from './facebookLoginCookie'

type ShopifyAttribute = { key: string; value: string }

function readIdentity(
  cookieHeader: string | undefined,
  environment: Readonly<Record<string, string | undefined>>
) {
  const config = readFacebookLoginConfig(environment)
  return readFacebookLoginIdentityCookie({
    cookieHeader,
    identityKey: config.identityKey
  })
}

export function enrichCheckoutAttributionWithFacebookLogin(
  snapshot: CheckoutAttributionSnapshot | undefined,
  cookieHeader: string | undefined,
  environment: Readonly<
    Record<string, string | undefined>
  > = process.env
): CheckoutAttributionSnapshot | undefined {
  if (!snapshot || snapshot.consent.marketing !== 'granted') {
    return snapshot
  }

  try {
    const identity = readIdentity(cookieHeader, environment)
    if (!identity) return snapshot

    const emailHashes = [
      ...new Set([
        ...(snapshot.user_data?.email_sha256 ?? []),
        ...(identity.emailSha256 ? [identity.emailSha256] : [])
      ])
    ]
    const phoneHashes = [
      ...new Set([
        ...(snapshot.user_data?.phone_sha256 ?? []),
        ...(identity.phoneSha256 ? [identity.phoneSha256] : [])
      ])
    ]

    return checkoutAttributionSnapshotSchema.parse({
      ...snapshot,
      external_id: snapshot.external_id ?? identity.externalId,
      browser_id: {
        ...snapshot.browser_id,
        ...(identity.fbc && !snapshot.browser_id?.fbc ?
          { fbc: identity.fbc }
        : {})
      },
      click_id: {
        ...snapshot.click_id,
        ...(identity.fbclid && !snapshot.click_id?.fbclid ?
          { fbclid: identity.fbclid }
        : {})
      },
      user_data: {
        ...snapshot.user_data,
        facebook_login_id: identity.facebookLoginId,
        ...(emailHashes.length > 0 ?
          { email_sha256: emailHashes }
        : {}),
        ...(phoneHashes.length > 0 ?
          { phone_sha256: phoneHashes }
        : {})
      }
    })
  } catch {
    return snapshot
  }
}

export function appendFacebookLoginShopifyAttributes(
  attributes: ShopifyAttribute[],
  cookieHeader: string | undefined,
  environment: Readonly<
    Record<string, string | undefined>
  > = process.env
) {
  try {
    const consentAttribute = attributes.find(
      attribute => attribute.key === 'utekos_consent'
    )
    const consent =
      consentAttribute ?
        JSON.parse(consentAttribute.value)
      : undefined
    if (consent?.marketing !== 'granted') return attributes

    const identity = readIdentity(cookieHeader, environment)
    if (!identity) return attributes

    const additions: ShopifyAttribute[] = [
      {
        key: FACEBOOK_LOGIN_ID_ATTRIBUTE,
        value: identity.facebookLoginId
      },
      ...(identity.emailSha256 ?
        [
          {
            key: FACEBOOK_EMAIL_SHA256_ATTRIBUTE,
            value: identity.emailSha256
          }
        ]
      : []),
      ...(identity.phoneSha256 ?
        [
          {
            key: FACEBOOK_PHONE_SHA256_ATTRIBUTE,
            value: identity.phoneSha256
          }
        ]
      : [])
    ]
    const additionKeys = new Set(additions.map(item => item.key))

    return [
      ...attributes.filter(item => !additionKeys.has(item.key)),
      ...additions
    ]
  } catch {
    return attributes
  }
}
