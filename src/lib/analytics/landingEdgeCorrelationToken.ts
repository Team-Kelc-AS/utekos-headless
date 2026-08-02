const LANDING_EDGE_CORRELATION_TOKEN_MAX_AGE_SECONDS =
  24 * 60 * 60
const LANDING_EDGE_CORRELATION_TOKEN_FUTURE_SKEW_SECONDS = 60
const MINIMUM_SIGNING_SECRET_LENGTH = 32

const encoder = new TextEncoder()

function assertSigningSecret(secret: string) {
  if (secret.length < MINIMUM_SIGNING_SECRET_LENGTH) {
    throw new Error(
      'Landing observability signing secret must contain at least 32 characters'
    )
  }
}

function correlationPayload(
  edgeRequestId: string,
  issuedAtSeconds: number
) {
  return `${edgeRequestId}.${issuedAtSeconds}`
}

function encodeBase64Url(bytes: Uint8Array) {
  const binary = String.fromCharCode(...bytes)

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]{43}$/u.test(value)) return undefined

  try {
    const padded = value
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '=')
    const binary = atob(padded)

    return Uint8Array.from(binary, character =>
      character.charCodeAt(0)
    )
  } catch {
    return undefined
  }
}

async function importSigningKey(
  secret: string,
  usages: KeyUsage[]
) {
  assertSigningSecret(secret)

  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    usages
  )
}

export async function createLandingEdgeCorrelationToken(input: {
  edgeRequestId: string
  issuedAtSeconds: number
  secret: string
}) {
  const key = await importSigningKey(input.secret, ['sign'])
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(
      correlationPayload(
        input.edgeRequestId,
        input.issuedAtSeconds
      )
    )
  )

  return `${input.issuedAtSeconds}.${encodeBase64Url(new Uint8Array(signature))}`
}

export async function verifyLandingEdgeCorrelationToken(input: {
  edgeRequestId: string
  nowSeconds: number
  secret: string
  token: string
}) {
  const match = /^(\d{10})\.([A-Za-z0-9_-]{43})$/u.exec(
    input.token
  )
  if (!match) return false

  const issuedAtSeconds = Number(match[1])
  const signature = decodeBase64Url(match[2] ?? '')
  if (!Number.isSafeInteger(issuedAtSeconds) || !signature) {
    return false
  }
  if (
    issuedAtSeconds >
      input.nowSeconds +
        LANDING_EDGE_CORRELATION_TOKEN_FUTURE_SKEW_SECONDS ||
    input.nowSeconds - issuedAtSeconds >
      LANDING_EDGE_CORRELATION_TOKEN_MAX_AGE_SECONDS
  ) {
    return false
  }

  const key = await importSigningKey(input.secret, ['verify'])

  return crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    encoder.encode(
      correlationPayload(input.edgeRequestId, issuedAtSeconds)
    )
  )
}

export {
  LANDING_EDGE_CORRELATION_TOKEN_MAX_AGE_SECONDS,
  MINIMUM_SIGNING_SECRET_LENGTH
}
