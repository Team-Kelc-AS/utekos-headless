import 'server-only'

import {
  createCipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} from 'node:crypto'
import { z } from 'zod'

const DEFAULT_CUSTOMER_ACCOUNT_URL =
  'https://shopify.com/63421546744/account'

const customerAccountConfigSchema = z.object({
  storeDomain: z
    .string()
    .trim()
    .min(1)
    .transform(value =>
      value
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .toLowerCase()
    ),
  customerAccountUrl: z.string().url(),
  clientId: z.string().trim().min(1).optional(),
  clientSecret: z.string().trim().min(1).optional(),
  sessionSecret: z.string().min(32).optional()
})

const openIdConfigurationSchema = z.object({
  authorization_endpoint: z.string().url(),
  token_endpoint: z.string().url(),
  end_session_endpoint: z.string().url().optional()
})

const authStateSchema = z.object({
  state: z.string().min(32),
  nonce: z.string().min(32),
  codeVerifier: z.string().min(43).max(128),
  returnTo: z.string().startsWith('/'),
  expiresAt: z.number().int().positive()
})

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1).optional(),
  id_token: z.string().min(1).optional()
})

export const CUSTOMER_AUTH_STATE_COOKIE = 'utekos_customer_auth'
export const CUSTOMER_SESSION_COOKIE = 'utekos_customer_session'

export type CustomerAccountConfig = z.infer<
  typeof customerAccountConfigSchema
>
export type CustomerAccountAuthState = z.infer<
  typeof authStateSchema
>
export type CustomerAccountTokenResponse = z.infer<
  typeof tokenResponseSchema
>

export function getCustomerAccountConfig(): CustomerAccountConfig {
  return customerAccountConfigSchema.parse({
    storeDomain: process.env.STORE_DOMAIN,
    customerAccountUrl:
      process.env.SHOPIFY_CUSTOMER_ACCOUNT_URL ??
      DEFAULT_CUSTOMER_ACCOUNT_URL,
    clientId: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID,
    clientSecret:
      process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET,
    sessionSecret:
      process.env.SHOPIFY_CUSTOMER_ACCOUNT_SESSION_SECRET
  })
}

export function hasCustomerAccountOAuthConfig(
  config: CustomerAccountConfig
): config is CustomerAccountConfig & {
  clientId: string
  sessionSecret: string
} {
  return Boolean(config.clientId && config.sessionSecret)
}

export function getHostedCustomerAccountLoginUrl(
  customerAccountUrl: string
) {
  return new URL(
    'login',
    `${customerAccountUrl.replace(/\/$/, '')}/`
  ).toString()
}

export function normalizeCustomerReturnTo(
  value: string | null | undefined
) {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//')
  ) {
    return '/'
  }

  try {
    const parsed = new URL(value, 'https://utekos.no')

    if (parsed.origin !== 'https://utekos.no') {
      return '/'
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/'
  }
}

export function createCustomerAccountAuthState(
  returnTo: string
): CustomerAccountAuthState & { codeChallenge: string } {
  const codeVerifier = randomBytes(64).toString('base64url')

  return {
    state: randomBytes(32).toString('base64url'),
    nonce: randomBytes(32).toString('base64url'),
    codeVerifier,
    codeChallenge: createHash('sha256')
      .update(codeVerifier)
      .digest('base64url'),
    returnTo: normalizeCustomerReturnTo(returnTo),
    expiresAt: Date.now() + 10 * 60 * 1000
  }
}

export function signCustomerAccountAuthState(
  payload: CustomerAccountAuthState,
  secret: string
) {
  const encodedPayload = Buffer.from(
    JSON.stringify(authStateSchema.parse(payload))
  ).toString('base64url')
  const signature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

export function verifyCustomerAccountAuthState(
  value: string,
  secret: string
) {
  const [encodedPayload, suppliedSignature] = value.split('.')

  if (!encodedPayload || !suppliedSignature) {
    return null
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url')
  const suppliedBuffer = Buffer.from(suppliedSignature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const parsed = authStateSchema.parse(
      JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8')
      )
    )

    return parsed.expiresAt > Date.now() ? parsed : null
  } catch {
    return null
  }
}

export function encryptCustomerAccountSession(
  token: CustomerAccountTokenResponse,
  secret: string
) {
  const key = createHash('sha256').update(secret).digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const sessionPayload = JSON.stringify({
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000
  })
  const encrypted = Buffer.concat([
    cipher.update(sessionPayload, 'utf8'),
    cipher.final()
  ])
  const authenticationTag = cipher.getAuthTag()

  return [iv, encrypted, authenticationTag]
    .map(value => value.toString('base64url'))
    .join('.')
}

export async function discoverCustomerAccountEndpoints(
  storeDomain: string
) {
  const response = await fetch(
    `https://${storeDomain}/.well-known/openid-configuration`,
    {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Utekos Headless Customer Account/1.0'
      }
    }
  )

  if (!response.ok) {
    throw new Error('Shopify customer account discovery failed')
  }

  return openIdConfigurationSchema.parse(await response.json())
}

export function parseCustomerAccountTokenResponse(
  value: unknown
) {
  return tokenResponseSchema.parse(value)
}
