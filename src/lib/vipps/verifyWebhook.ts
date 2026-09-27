import {
  createHash,
  createHmac,
  timingSafeEqual
} from 'node:crypto'

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return (
    left.length === right.length && timingSafeEqual(left, right)
  )
}

// registeredUrl is server configuration, never a forwarded Host supplied by the caller.
export function verifyVippsWebhook(input: {
  rawBody: string
  headers: Headers
  registeredUrl: string
  secret: string
  requestUrl: string
}) {
  try {
    if (!input.secret || !input.rawBody) return false
    const registered = new URL(input.registeredUrl)
    const requested = new URL(input.requestUrl)
    const date = input.headers.get('x-ms-date')
    const digest = input.headers.get('x-ms-content-sha256')
    const auth = input.headers.get('authorization')
    if (
      registered.protocol !== 'https:' ||
      !date ||
      !digest ||
      !auth ||
      !Number.isFinite(Date.parse(date)) ||
      requested.pathname + requested.search !==
        registered.pathname + registered.search
    )
      return false
    const expectedDigest = createHash('sha256')
      .update(input.rawBody)
      .digest('base64')
    if (!constantTimeEqual(digest, expectedDigest)) return false
    const signed = `POST\n${registered.pathname}${registered.search}\n${date};${registered.host};${digest}`
    const signature = createHmac('sha256', input.secret)
      .update(signed)
      .digest('base64')
    // Vipps secret is used as UTF-8, not decoded from base64. No short freshness window:
    // delayed delivery is safe through durable payment identity + idempotent reconciliation.
    return constantTimeEqual(
      auth,
      `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`
    )
  } catch {
    return false
  }
}
