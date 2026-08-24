import { z } from 'zod'
import { campaignAttributionSchema } from '@/lib/analytics/campaignAttribution'

export const FACEBOOK_LOGIN_OAUTH_COOKIE =
  'utekos_fb_login_oauth'
export const FACEBOOK_LOGIN_IDENTITY_COOKIE =
  'utekos_fb_login_identity'

export const FACEBOOK_LOGIN_OAUTH_MAX_AGE_SECONDS = 10 * 60
export const FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS =
  180 * 24 * 60 * 60

export const anonymousExternalIdSchema = z
  .string()
  .regex(
    /^anon_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
  )

const providerIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)

export const facebookLoginOAuthContextSchema = z.strictObject({
  attribution: campaignAttributionSchema.optional(),
  externalId: anonymousExternalIdSchema,
  fbc: providerIdentifierSchema.optional(),
  fbclid: providerIdentifierSchema.optional(),
  issuedAt: z.number().int().nonnegative(),
  returnTo: z
    .string()
    .regex(/^\/(?!\/)[^\\]*$/u)
    .max(2048),
  state: z.string().min(32).max(128)
})

export type FacebookLoginOAuthContext = z.infer<
  typeof facebookLoginOAuthContextSchema
>

export const facebookLoginIdentityCookieSchema = z.strictObject({
  emailSha256: sha256Schema.optional(),
  expiresAt: z.number().int().positive(),
  externalId: anonymousExternalIdSchema,
  facebookLoginId: z.string().regex(/^\d+$/u).max(64),
  fbc: providerIdentifierSchema.optional(),
  fbclid: providerIdentifierSchema.optional(),
  identityId: z.string().uuid(),
  phoneSha256: sha256Schema.optional()
})

export type FacebookLoginIdentityCookie = z.infer<
  typeof facebookLoginIdentityCookieSchema
>
