import 'server-only'

import { z } from 'zod'

const facebookLoginEnvironmentSchema = z.object({
  FACEBOOK_LOGIN_APP_ID: z.string().optional(),
  FACEBOOK_LOGIN_APP_SECRET: z.string().optional(),
  FACEBOOK_LOGIN_ENABLED: z.string().optional(),
  FACEBOOK_LOGIN_IDENTITY_KEY: z.string().optional(),
  FACEBOOK_LOGIN_REDIRECT_ORIGIN: z.string().optional(),
  VERCEL_ENV: z.string().optional()
})

const FACEBOOK_GRAPH_API_VERSION = 'v25.0'
const IDENTITY_KEY_BYTES = 32

export type FacebookLoginConfig = {
  apiVersion: typeof FACEBOOK_GRAPH_API_VERSION
  appId: string
  appSecret: string
  identityKey: Buffer
  redirectOrigin: string
}

export function isFacebookLoginEnabled(
  environment: Readonly<
    Record<string, string | undefined>
  > = process.env
): boolean {
  return (
    environment.FACEBOOK_LOGIN_ENABLED === 'true' &&
    environment.VERCEL_ENV === 'preview'
  )
}

export function readFacebookLoginConfig(
  environment: Readonly<
    Record<string, string | undefined>
  > = process.env
): FacebookLoginConfig {
  const parsed =
    facebookLoginEnvironmentSchema.parse(environment)

  if (parsed.FACEBOOK_LOGIN_ENABLED !== 'true') {
    throw new Error('facebook_login_disabled')
  }

  const appId = parsed.FACEBOOK_LOGIN_APP_ID?.trim()
  const appSecret = parsed.FACEBOOK_LOGIN_APP_SECRET?.trim()
  const encodedIdentityKey =
    parsed.FACEBOOK_LOGIN_IDENTITY_KEY?.trim()

  if (!appId || !/^\d+$/u.test(appId)) {
    throw new Error('facebook_login_app_id_invalid')
  }
  if (!appSecret) {
    throw new Error('facebook_login_app_secret_missing')
  }
  if (!encodedIdentityKey) {
    throw new Error('facebook_login_identity_key_missing')
  }

  const identityKey = Buffer.from(encodedIdentityKey, 'base64')
  if (
    identityKey.length !== IDENTITY_KEY_BYTES ||
    identityKey.toString('base64').replace(/=+$/u, '') !==
      encodedIdentityKey.replace(/=+$/u, '')
  ) {
    throw new Error('facebook_login_identity_key_invalid')
  }

  const redirectOriginValue =
    parsed.FACEBOOK_LOGIN_REDIRECT_ORIGIN?.trim() ||
    'https://utekos.no'
  let redirectOrigin: URL

  try {
    redirectOrigin = new URL(redirectOriginValue)
  } catch {
    throw new Error('facebook_login_redirect_origin_invalid')
  }

  const localhost = ['localhost', '127.0.0.1', '::1'].includes(
    redirectOrigin.hostname
  )

  if (
    redirectOrigin.pathname !== '/' ||
    redirectOrigin.search ||
    redirectOrigin.hash ||
    (redirectOrigin.protocol !== 'https:' && !localhost)
  ) {
    throw new Error('facebook_login_redirect_origin_invalid')
  }

  if (
    parsed.VERCEL_ENV === 'preview' &&
    !parsed.FACEBOOK_LOGIN_REDIRECT_ORIGIN
  ) {
    throw new Error('facebook_login_preview_origin_missing')
  }

  return {
    apiVersion: FACEBOOK_GRAPH_API_VERSION,
    appId,
    appSecret,
    identityKey,
    redirectOrigin: redirectOrigin.origin
  }
}
