import { createHmac, timingSafeEqual } from 'node:crypto'

import { z } from 'zod'

const dispatchIdSchema = z.string().uuid()
const SITE_URL = 'https://utekos.no'
const tokenSchema = z.string().regex(
  /^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/
)

function requireSecret(): string {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET

  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('email_unsubscribe_secret_invalid')
  }

  return secret
}

function signDispatchId(dispatchId: string): string {
  return createHmac('sha256', requireSecret())
    .update(dispatchId, 'utf8')
    .digest('base64url')
}

export function createAbandonedCheckoutRecoveryUnsubscribeToken(
  dispatchId: string
): string {
  const parsedDispatchId = dispatchIdSchema.parse(dispatchId)
  return `${parsedDispatchId}.${signDispatchId(parsedDispatchId)}`
}

export function verifyAbandonedCheckoutRecoveryUnsubscribeToken(
  token: string
): string | null {
  const parsed = tokenSchema.safeParse(token)

  if (!parsed.success) {
    return null
  }

  const separator = parsed.data.lastIndexOf('.')
  const dispatchId = parsed.data.slice(0, separator)
  const supplied = Buffer.from(parsed.data.slice(separator + 1))
  const expected = Buffer.from(signDispatchId(dispatchId))

  return supplied.length === expected.length &&
    timingSafeEqual(supplied, expected) ?
      dispatchIdSchema.parse(dispatchId)
    : null
}

export function getAbandonedCheckoutRecoveryUnsubscribeUrl(
  dispatchId: string
): string {
  const token = createAbandonedCheckoutRecoveryUnsubscribeToken(dispatchId)
  const url = new URL('/avmelding', SITE_URL)
  url.searchParams.set('token', token)
  return url.toString()
}

export function getAbandonedCheckoutRecoveryOneClickUnsubscribeUrl(
  dispatchId: string
): string {
  const token = createAbandonedCheckoutRecoveryUnsubscribeToken(dispatchId)
  const url = new URL('/api/email/unsubscribe', SITE_URL)
  url.searchParams.set('token', token)
  return url.toString()
}
