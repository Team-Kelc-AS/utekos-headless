import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from 'node:crypto'

import { z } from 'zod'

const CUSTOMER_ID_PATTERN = /^gid:\/\/shopify\/Customer\/[0-9]+$/
const TOKEN_LIFETIME_SECONDS = 400 * 24 * 60 * 60
const AAD = Buffer.from(
  'utekos:abandoned-checkout-recovery:unsubscribe:v1',
  'utf8'
)

const payloadSchema = z.strictObject({
  version: z.literal(1),
  shopifyCustomerId: z.string().regex(CUSTOMER_ID_PATTERN),
  issuedAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive()
})

function getSecret(secret?: string): string {
  const resolved = secret ?? process.env.EMAIL_UNSUBSCRIBE_SECRET

  if (!resolved || Buffer.byteLength(resolved, 'utf8') < 32) {
    throw new Error(
      'abandoned_checkout_recovery_unsubscribe_secret_invalid'
    )
  }

  return resolved
}

function getKey(secret?: string): Buffer {
  return createHash('sha256')
    .update(getSecret(secret), 'utf8')
    .digest()
}

function getBaseUrl(baseUrl?: string): URL {
  let parsed: URL

  try {
    parsed = new URL(
      baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''
    )
  } catch {
    throw new Error(
      'abandoned_checkout_recovery_unsubscribe_base_url_invalid'
    )
  }

  if (
    parsed.protocol !== 'https:'
    || parsed.username !== ''
    || parsed.password !== ''
  ) {
    throw new Error(
      'abandoned_checkout_recovery_unsubscribe_base_url_invalid'
    )
  }

  return parsed
}

export function createAbandonedCheckoutRecoveryUnsubscribeUrl(
  input: {
    shopifyCustomerId: string
    now?: Date
  },
  dependencies: {
    secret?: string
    baseUrl?: string
    randomBytes?: (size: number) => Buffer
  } = {}
): string {
  const now = input.now ?? new Date()
  const nowSeconds = Math.floor(now.getTime() / 1000)
  const payload = payloadSchema.safeParse({
    version: 1,
    shopifyCustomerId: input.shopifyCustomerId,
    issuedAt: nowSeconds,
    expiresAt: nowSeconds + TOKEN_LIFETIME_SECONDS
  })

  if (!Number.isFinite(now.getTime()) || !payload.success) {
    throw new Error(
      'abandoned_checkout_recovery_unsubscribe_input_invalid'
    )
  }

  const iv = (dependencies.randomBytes ?? randomBytes)(12)

  if (iv.length !== 12) {
    throw new Error(
      'abandoned_checkout_recovery_unsubscribe_random_invalid'
    )
  }

  const cipher = createCipheriv(
    'aes-256-gcm',
    getKey(dependencies.secret),
    iv
  )
  cipher.setAAD(AAD)
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload.data), 'utf8'),
    cipher.final()
  ])
  const token = [
    'u1',
    iv.toString('base64url'),
    ciphertext.toString('base64url'),
    cipher.getAuthTag().toString('base64url')
  ].join('.')
  const url = new URL(
    '/api/email/abandoned-checkout-recovery/unsubscribe',
    getBaseUrl(dependencies.baseUrl)
  )
  url.searchParams.set('token', token)

  return url.toString()
}

export function verifyAbandonedCheckoutRecoveryUnsubscribeToken(
  token: string,
  dependencies: {
    secret?: string
    now?: Date
  } = {}
): { shopifyCustomerId: string } {
  const parts = token.split('.')
  const [version, ivPart, ciphertextPart, tagPart] = parts

  if (
    parts.length !== 4
    || version !== 'u1'
    || !ivPart
    || !ciphertextPart
    || !tagPart
    || ivPart.length !== 16
    || tagPart.length !== 22
  ) {
    throw new Error(
      'abandoned_checkout_recovery_unsubscribe_token_invalid'
    )
  }

  const now = dependencies.now ?? new Date()

  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      getKey(dependencies.secret),
      Buffer.from(ivPart, 'base64url')
    )
    decipher.setAAD(AAD)
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, 'base64url')),
      decipher.final()
    ]).toString('utf8')
    const payload = payloadSchema.parse(JSON.parse(plaintext))
    const nowSeconds = Math.floor(now.getTime() / 1000)

    if (
      !Number.isFinite(now.getTime())
      || payload.expiresAt <= nowSeconds
      || payload.issuedAt > nowSeconds + 5 * 60
      || payload.expiresAt - payload.issuedAt
        !== TOKEN_LIFETIME_SECONDS
    ) {
      throw new Error('expired')
    }

    return {
      shopifyCustomerId: payload.shopifyCustomerId
    }
  } catch {
    throw new Error(
      'abandoned_checkout_recovery_unsubscribe_token_invalid'
    )
  }
}
