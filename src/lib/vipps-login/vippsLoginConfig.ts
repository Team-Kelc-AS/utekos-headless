import 'server-only'

import { z } from 'zod'

const vippsLoginEnvironmentSchema = z.object({
  VERCEL_ENV: z.string().optional(),
  VIPPS_CLIENT_ID: z.string().optional(),
  VIPPS_CLIENT_SECRET: z.string().optional(),
  VIPPS_ENVIRONMENT: z.string().optional(),
  VIPPS_LOGIN_ENABLED: z.string().optional(),
  VIPPS_LOGIN_REDIRECT_ORIGIN: z.string().optional(),
  VIPPS_LOGIN_SESSION_SECRET: z.string().optional(),
  VIPPS_TEST_CLIENT_ID: z.string().optional(),
  VIPPS_TEST_CLIENT_SECRET: z.string().optional()
})

const DEFAULT_REDIRECT_ORIGIN = 'https://utekos.no'
const SESSION_KEY_BYTES = 32

export type VippsLoginConfig = {
  apiBaseUrl: string
  callbackUrl: string
  clientId: string
  clientSecret: string
  environment: 'test' | 'production'
  issuer: URL
  redirectOrigin: string
  sessionKey: Buffer
}

function readSessionKey(value: string | undefined) {
  const encoded = value?.trim()
  if (!encoded) {
    throw new Error('vipps_login_session_secret_missing')
  }

  const key = Buffer.from(encoded, 'base64')
  if (
    key.length !== SESSION_KEY_BYTES ||
    key.toString('base64').replace(/=+$/u, '') !==
      encoded.replace(/=+$/u, '')
  ) {
    throw new Error('vipps_login_session_secret_invalid')
  }

  return key
}

function readRedirectOrigin(
  value: string | undefined,
  environment: 'test' | 'production',
  vercelEnvironment: string | undefined
) {
  if (
    !value?.trim() &&
    (environment === 'test' || vercelEnvironment === 'preview')
  ) {
    throw new Error('vipps_login_redirect_origin_missing')
  }

  let url: URL
  try {
    url = new URL(value?.trim() || DEFAULT_REDIRECT_ORIGIN)
  } catch {
    throw new Error('vipps_login_redirect_origin_invalid')
  }

  const local = ['localhost', '127.0.0.1', '::1'].includes(
    url.hostname
  )
  if (
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    (url.protocol !== 'https:' && !local)
  ) {
    throw new Error('vipps_login_redirect_origin_invalid')
  }

  return url.origin
}

export function readVippsLoginConfig(
  environmentValues: Readonly<
    Record<string, string | undefined>
  > = process.env
): VippsLoginConfig {
  const parsed = vippsLoginEnvironmentSchema.parse(
    environmentValues
  )

  if (parsed.VIPPS_LOGIN_ENABLED !== 'true') {
    throw new Error('vipps_login_disabled')
  }

  const environment = parsed.VIPPS_ENVIRONMENT ?? 'test'
  if (environment !== 'test' && environment !== 'production') {
    throw new Error('vipps_login_environment_invalid')
  }

  const production = environment === 'production'
  const clientId = (
    production ?
      parsed.VIPPS_CLIENT_ID
    : parsed.VIPPS_TEST_CLIENT_ID)?.trim()
  const clientSecret = (
    production ?
      parsed.VIPPS_CLIENT_SECRET
    : parsed.VIPPS_TEST_CLIENT_SECRET)?.trim()

  if (!clientId) throw new Error('vipps_login_client_id_missing')
  if (!clientSecret) {
    throw new Error('vipps_login_client_secret_missing')
  }

  const apiBaseUrl =
    production ?
      'https://api.vipps.no'
    : 'https://apitest.vipps.no'
  const redirectOrigin = readRedirectOrigin(
    parsed.VIPPS_LOGIN_REDIRECT_ORIGIN,
    environment,
    parsed.VERCEL_ENV
  )

  return {
    apiBaseUrl,
    callbackUrl: new URL(
      '/api/identity/vipps/callback',
      redirectOrigin
    ).toString(),
    clientId,
    clientSecret,
    environment,
    issuer: new URL(
      '/access-management-1.0/access/',
      apiBaseUrl
    ),
    redirectOrigin,
    sessionKey: readSessionKey(parsed.VIPPS_LOGIN_SESSION_SECRET)
  }
}
