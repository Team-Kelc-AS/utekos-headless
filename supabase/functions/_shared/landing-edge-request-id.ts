const UUID_URL_NAMESPACE = Uint8Array.of(
  0x6b,
  0xa7,
  0xb8,
  0x11,
  0x9d,
  0xad,
  0x11,
  0xd1,
  0x80,
  0xb4,
  0x00,
  0xc0,
  0x4f,
  0xd4,
  0x30,
  0xc8
)
const VERCEL_REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,256}$/u
const LANDING_EDGE_UUID_NAME_PREFIX =
  'https://utekos.no/vercel-request/'

export function readVercelRequestId(
  value: string | null | undefined
): string | undefined {
  const candidate = value?.split('::').pop()?.trim()

  return candidate && VERCEL_REQUEST_ID_PATTERN.test(candidate) ?
      candidate
    : undefined
}

export async function deriveLandingEdgeRequestId(
  vercelIdOrRequestId: string | null | undefined
): Promise<string | undefined> {
  const requestId = readVercelRequestId(vercelIdOrRequestId)
  if (!requestId) return undefined

  const nameBytes = new TextEncoder().encode(
    `${LANDING_EDGE_UUID_NAME_PREFIX}${requestId}`
  )
  const input = new Uint8Array(
    UUID_URL_NAMESPACE.length + nameBytes.length
  )
  input.set(UUID_URL_NAMESPACE)
  input.set(nameBytes, UUID_URL_NAMESPACE.length)

  // SHA-1 is required by UUIDv5; this identifier is not a security primitive.
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-1', input)
  )
  const uuidBytes = digest.slice(0, 16)
  uuidBytes[6] = (uuidBytes[6]! & 0x0f) | 0x50
  uuidBytes[8] = (uuidBytes[8]! & 0x3f) | 0x80

  const hexadecimal = Array.from(uuidBytes, byte =>
    byte.toString(16).padStart(2, '0')
  ).join('')

  return [
    hexadecimal.slice(0, 8),
    hexadecimal.slice(8, 12),
    hexadecimal.slice(12, 16),
    hexadecimal.slice(16, 20),
    hexadecimal.slice(20)
  ].join('-')
}
