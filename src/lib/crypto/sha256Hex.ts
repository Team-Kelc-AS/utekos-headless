const encoder = new TextEncoder()

export async function sha256Hex(value: string) {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error(
      'Web Crypto SubtleCrypto.digest requires a secure context'
    )
  }

  const digest = await subtle.digest(
    'SHA-256',
    encoder.encode(value)
  )

  return bytesToHex(new Uint8Array(digest))
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, byte =>
    byte.toString(16).padStart(2, '0')
  ).join('')
}
