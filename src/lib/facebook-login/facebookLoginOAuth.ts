import 'server-only'

import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { parseCampaignAttribution } from '@/lib/analytics/campaignAttribution'
import { extractFbclidFromFbc } from '@/lib/analytics/extractFbclidFromFbc'
import { FIRST_PARTY_EXTERNAL_ID_COOKIE } from '@/lib/analytics/firstPartyExternalId'
import {
  anonymousExternalIdSchema,
  facebookLoginOAuthContextSchema,
  type FacebookLoginOAuthContext
} from './facebookLoginContracts'
import type { FacebookLoginConfig } from './facebookLoginConfig'

const accessTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive().optional(),
  token_type: z.string().min(1).optional()
})

const debugTokenResponseSchema = z.object({
  data: z.object({
    app_id: z.union([z.string(), z.number()]),
    is_valid: z.literal(true),
    scopes: z.array(z.string()).optional(),
    type: z.string().optional(),
    user_id: z.union([z.string(), z.number()])
  })
})

const profileResponseSchema = z.object({
  email: z.string().email().max(320).optional(),
  id: z.union([z.string(), z.number()])
})

const GRAPH_TIMEOUT_MS = 10_000

function readCookie(cookieHeader: string, name: string) {
  const prefix = `${name}=`
  for (const part of cookieHeader.split(';')) {
    const candidate = part.trim()
    if (!candidate.startsWith(prefix)) continue
    const value = candidate.slice(prefix.length)
    if (!value) return undefined

    try {
      return decodeURIComponent(value)
    } catch {
      return undefined
    }
  }
  return undefined
}

function safeReturnTo(value: string | null, origin: string) {
  if (!value) return '/'

  try {
    const parsed = new URL(value, origin)
    if (parsed.origin !== origin) return '/'
    parsed.searchParams.delete('facebook_login')
    return facebookLoginOAuthContextSchema.shape.returnTo.parse(
      `${parsed.pathname}${parsed.search}${parsed.hash}`
    )
  } catch {
    return '/'
  }
}

export function createFacebookLoginOAuthContext(input: {
  cookieHeader: string | undefined
  now?: number
  origin: string
  returnTo: string | null
}): FacebookLoginOAuthContext {
  const returnTo = safeReturnTo(input.returnTo, input.origin)
  const returnUrl = new URL(returnTo, input.origin)
  const fbc = readCookie(input.cookieHeader ?? '', '_fbc')
  const validFbc = extractFbclidFromFbc(fbc) ? fbc : undefined
  const fbclid =
    returnUrl.searchParams.get('fbclid')?.trim() ||
    extractFbclidFromFbc(validFbc)
  const existingExternalId = readCookie(
    input.cookieHeader ?? '',
    FIRST_PARTY_EXTERNAL_ID_COOKIE
  )
  const parsedExternalId = anonymousExternalIdSchema.safeParse(
    existingExternalId
  )
  const externalId =
    parsedExternalId.success ?
      parsedExternalId.data
    : `anon_${randomUUID()}`
  const attribution = parseCampaignAttribution(
    Object.fromEntries(returnUrl.searchParams.entries())
  )

  return facebookLoginOAuthContextSchema.parse({
    state: randomBytes(32).toString('base64url'),
    returnTo,
    issuedAt: input.now ?? Date.now(),
    externalId,
    ...(fbclid ? { fbclid } : {}),
    ...(validFbc ? { fbc: validFbc } : {}),
    ...(attribution ? { attribution } : {})
  })
}

export function buildFacebookLoginDialogUrl(
  config: FacebookLoginConfig,
  context: FacebookLoginOAuthContext
) {
  const redirectUri = `${config.redirectOrigin}/api/identity/facebook/callback`
  const url = new URL(
    `https://www.facebook.com/${config.apiVersion}/dialog/oauth`
  )
  url.searchParams.set('client_id', config.appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'public_profile,email')
  url.searchParams.set('state', context.state)
  return url
}

async function fetchGraphJson(
  url: URL,
  fetchFn: typeof fetch
): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    GRAPH_TIMEOUT_MS
  )

  try {
    const response = await fetchFn(url, {
      cache: 'no-store',
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error('facebook_login_graph_rejected')
    }

    return await response.json()
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'facebook_login_graph_rejected'
    ) {
      throw error
    }
    throw new Error('facebook_login_graph_unavailable')
  } finally {
    clearTimeout(timeout)
  }
}

export async function exchangeFacebookLoginCode(input: {
  code: string
  config: FacebookLoginConfig
  fetchFn?: typeof fetch
}) {
  const { config } = input
  const fetchFn = input.fetchFn ?? fetch
  const redirectUri = `${config.redirectOrigin}/api/identity/facebook/callback`

  const tokenUrl = new URL(
    `https://graph.facebook.com/${config.apiVersion}/oauth/access_token`
  )
  tokenUrl.searchParams.set('client_id', config.appId)
  tokenUrl.searchParams.set('client_secret', config.appSecret)
  tokenUrl.searchParams.set('redirect_uri', redirectUri)
  tokenUrl.searchParams.set('code', input.code)

  const token = accessTokenResponseSchema.parse(
    await fetchGraphJson(tokenUrl, fetchFn)
  )

  return validateFacebookLoginAccessToken({
    accessToken: token.access_token,
    config,
    fetchFn
  })
}

export async function validateFacebookLoginAccessToken(input: {
  accessToken: string
  config: FacebookLoginConfig
  expectedUserId?: string
  fetchFn?: typeof fetch
}) {
  const { config } = input
  const fetchFn = input.fetchFn ?? fetch
  const appAccessToken = `${config.appId}|${config.appSecret}`

  const debugUrl = new URL(
    `https://graph.facebook.com/${config.apiVersion}/debug_token`
  )
  debugUrl.searchParams.set('input_token', input.accessToken)
  debugUrl.searchParams.set('access_token', appAccessToken)

  const debug = debugTokenResponseSchema.parse(
    await fetchGraphJson(debugUrl, fetchFn)
  )
  const facebookLoginId = String(debug.data.user_id)

  if (
    String(debug.data.app_id) !== config.appId ||
    !/^\d+$/u.test(facebookLoginId) ||
    (input.expectedUserId &&
      input.expectedUserId !== facebookLoginId)
  ) {
    throw new Error('facebook_login_token_identity_invalid')
  }

  const profileUrl = new URL(
    `https://graph.facebook.com/${config.apiVersion}/me`
  )
  profileUrl.searchParams.set('fields', 'id,email')
  profileUrl.searchParams.set('access_token', input.accessToken)
  profileUrl.searchParams.set(
    'appsecret_proof',
    createHmac('sha256', config.appSecret)
      .update(input.accessToken, 'utf8')
      .digest('hex')
  )

  const profile = profileResponseSchema.parse(
    await fetchGraphJson(profileUrl, fetchFn)
  )

  if (String(profile.id) !== facebookLoginId) {
    throw new Error('facebook_login_profile_identity_mismatch')
  }

  return {
    facebookLoginId,
    ...(profile.email ? { email: profile.email } : {}),
    emailPermissionGranted:
      Boolean(profile.email) &&
      (debug.data.scopes?.includes('email') ?? true)
  }
}

export function appendFacebookLoginResult(
  origin: string,
  returnTo: string,
  result: 'connected' | 'needs_contact' | 'error'
) {
  const url = new URL(returnTo, origin)
  url.searchParams.set('facebook_login', result)
  return url
}
