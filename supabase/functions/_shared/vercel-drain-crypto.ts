const textEncoder = new TextEncoder()

type HmacAlgorithm = 'SHA-1' | 'SHA-256'

function copyBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte =>
    byte.toString(16).padStart(2, '0')
  ).join('')
}

function decodeHex(value: string): Uint8Array | null {
  if (value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value))
    return null

  const bytes = new Uint8Array(value.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(
      value.slice(index * 2, index * 2 + 2),
      16
    )
  }

  return bytes
}

function constantTimeEqual(
  left: Uint8Array,
  right: Uint8Array
): boolean {
  if (left.byteLength !== right.byteLength) return false

  let difference = 0
  for (let index = 0; index < left.byteLength; index += 1) {
    difference |= left[index]! ^ right[index]!
  }

  return difference === 0
}

export async function computeHmacHex(
  data: Uint8Array | string,
  secret: string,
  algorithm: HmacAlgorithm
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { hash: algorithm, name: 'HMAC' },
    false,
    ['sign']
  )
  const input =
    typeof data === 'string' ? textEncoder.encode(data) : data
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    copyBytes(input)
  )

  return bytesToHex(new Uint8Array(signature))
}

export async function verifyVercelSignature(
  body: Uint8Array,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false

  const supplied = decodeHex(signatureHeader.trim())
  if (!supplied || supplied.byteLength !== 20) return false

  const expectedHex = await computeHmacHex(body, secret, 'SHA-1')
  const expected = decodeHex(expectedHex)

  return (
    expected !== null && constantTimeEqual(expected, supplied)
  )
}
