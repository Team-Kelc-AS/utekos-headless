import { z } from 'zod'

export const VIPPS_LOGIN_OAUTH_COOKIE =
  'utekos_vipps_login_oauth'
export const VIPPS_LOGIN_IDENTITY_COOKIE =
  'utekos_vipps_login_identity'

export const VIPPS_LOGIN_OAUTH_MAX_AGE_SECONDS = 10 * 60
export const VIPPS_LOGIN_IDENTITY_MAX_AGE_SECONDS = 60 * 60

export const vippsLoginOAuthContextSchema = z.strictObject({
  codeVerifier: z.string().min(43).max(128),
  issuedAt: z.number().int().nonnegative(),
  returnTo: z
    .string()
    .regex(/^\/(?!\/)[^\\]*$/u)
    .max(2048),
  state: z.string().min(8).max(256)
})

export type VippsLoginOAuthContext = z.infer<
  typeof vippsLoginOAuthContextSchema
>

export const vippsLoginIdentitySchema = z.strictObject({
  authenticatedAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive(),
  issuer: z.string().url(),
  sub: z.string().trim().min(1).max(255)
})

export type VippsLoginIdentity = z.infer<
  typeof vippsLoginIdentitySchema
>
