const SYNTHETIC_TIMESTAMP_HEADER =
  'x-utekos-synthetic-timestamp'
const SYNTHETIC_SIGNATURE_HEADER =
  'x-utekos-synthetic-signature'
const MAX_SYNTHETIC_CLOCK_SKEW_SECONDS = 5 * 60

type SyntheticTrafficEnvironment = Readonly<
  Record<string, string | undefined>
>

function syntheticSignaturePayload(
  request: Request,
  timestamp: string
) {
  return [
    request.method.toUpperCase(),
    new URL(request.url).pathname,
    timestamp
  ].join('\n')
}

function decodeHex(value: string) {
  if (!/^[a-f0-9]{64}$/iu.test(value)) return undefined

  return Uint8Array.from(
    value.match(/.{2}/gu) ?? [],
    byte => Number.parseInt(byte, 16)
  )
}

async function hasVerifiedSyntheticSignature(
  request: Request,
  environment: SyntheticTrafficEnvironment,
  nowSeconds: number
) {
  const secret =
    environment.UTEKOS_SYNTHETIC_TRAFFIC_SECRET?.trim()
  const timestamp = request.headers.get(
    SYNTHETIC_TIMESTAMP_HEADER
  )
  const provided = decodeHex(
    request.headers.get(SYNTHETIC_SIGNATURE_HEADER) ?? ''
  )

  if (!secret || !timestamp || !provided) return false
  if (!/^\d{10}$/u.test(timestamp)) return false

  const timestampSeconds = Number(timestamp)
  if (
    Math.abs(nowSeconds - timestampSeconds) >
    MAX_SYNTHETIC_CLOCK_SKEW_SECONDS
  ) {
    return false
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    ['verify']
  )

  return crypto.subtle.verify(
    'HMAC',
    key,
    provided,
    new TextEncoder().encode(
      syntheticSignaturePayload(request, timestamp)
    )
  )
}

export {
  hasVerifiedSyntheticSignature,
  SYNTHETIC_SIGNATURE_HEADER,
  SYNTHETIC_TIMESTAMP_HEADER,
  syntheticSignaturePayload
}
