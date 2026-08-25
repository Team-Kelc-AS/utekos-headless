import 'server-only'

import {
  FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS,
  type FacebookLoginOAuthContext
} from './facebookLoginContracts'
import type { FacebookLoginConfig } from './facebookLoginConfig'
import { encryptFacebookLoginJson } from './facebookLoginCrypto'
import { protectFacebookLoginContact } from './protectFacebookLoginContact'
import { upsertFacebookLoginIdentity } from './postgresFacebookLoginIdentityStore'

type VerifiedFacebookLoginIdentity = {
  email?: string
  emailPermissionGranted: boolean
  facebookLoginId: string
}

export async function finalizeFacebookLoginIdentity(input: {
  config: FacebookLoginConfig
  context: FacebookLoginOAuthContext
  identity: VerifiedFacebookLoginIdentity
  now?: number
}) {
  const protectedEmail =
    input.identity.email ?
      protectFacebookLoginContact(
        input.identity.email,
        input.config.identityKey
      )
    : undefined

  if (protectedEmail && protectedEmail.kind !== 'email') {
    throw new Error('facebook_login_email_invalid')
  }

  const stored = await upsertFacebookLoginIdentity({
    appId: input.config.appId,
    emailPermissionGranted:
      input.identity.emailPermissionGranted,
    externalId: input.context.externalId,
    facebookLoginId: input.identity.facebookLoginId,
    ...(input.context.attribution ?
      { attribution: input.context.attribution }
    : {}),
    ...(input.context.fbc ? { fbc: input.context.fbc } : {}),
    ...(input.context.fbclid ?
      { fbclid: input.context.fbclid }
    : {}),
    ...(protectedEmail ?
      {
        emailCiphertext: protectedEmail.ciphertext,
        emailSha256: protectedEmail.sha256
      }
    : {})
  })

  const expiresAt =
    (input.now ?? Date.now()) +
    FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS * 1000
  const identityCookie = encryptFacebookLoginJson(
    {
      identityId: stored.id,
      facebookLoginId: input.identity.facebookLoginId,
      externalId: input.context.externalId,
      expiresAt,
      ...(input.context.fbc ? { fbc: input.context.fbc } : {}),
      ...(input.context.fbclid ?
        { fbclid: input.context.fbclid }
      : {}),
      ...(protectedEmail ?
        { emailSha256: protectedEmail.sha256 }
      : {})
    },
    'identity-cookie',
    input.config.identityKey
  )

  return {
    identityCookie,
    result:
      protectedEmail ?
        ('connected' as const)
      : ('needs_contact' as const)
  }
}
