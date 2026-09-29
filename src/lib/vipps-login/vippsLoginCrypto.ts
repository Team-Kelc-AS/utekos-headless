import 'server-only'

import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes
} from 'node:crypto'
import type { z } from 'zod'

const IV_BYTES = 12
const KEY_BYTES = 32
const VERSION = 'v1'
const KEY_INFO = Buffer.from('utekos-vipps-login-v1', 'utf8')

type VippsLoginTokenPurpose = 'oauth-state' | 'identity-cookie'

function deriveKey(
  rootKey: Buffer,
  purpose: VippsLoginTokenPurpose
) {
  if (rootKey.length !== KEY_BYTES) {
    throw new Error('vipps_login_session_key_invalid')
  }

  return Buffer.from(
    hkdfSync(
      'sha256',
      rootKey,
      Buffer.alloc(0),
      Buffer.concat([
        KEY_INFO,
        Buffer.from(`:${purpose}`, 'utf8')
      ]),
      KEY_BYTES
    )
  )
}

function additionalAuthenticatedData(
  purpose: VippsLoginTokenPurpose
) {
  return Buffer.from(
    `utekos:vipps-login:${VERSION}:${purpose}`,
    'utf8'
  )
}

function decodeCanonicalBase64Url(value: string) {
  const decoded = Buffer.from(value, 'base64url')
  if (decoded.toString('base64url') !== value) {
    throw new Error('vipps_login_token_invalid')
  }
  return decoded
}

export function encryptVippsLoginJson<T>(
  value: T,
  purpose: VippsLoginTokenPurpose,
  rootKey: Buffer,
  getRandomBytes: (size: number) => Buffer = randomBytes
) {
  const iv = getRandomBytes(IV_BYTES)
  if (iv.length !== IV_BYTES) {
    throw new Error('vipps_login_random_invalid')
  }

  const cipher = createCipheriv(
    'aes-256-gcm',
    deriveKey(rootKey, purpose),
    iv
  )
  cipher.setAAD(additionalAuthenticatedData(purpose))

  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final()
  ])

  return [
    VERSION,
    iv.toString('base64url'),
    ciphertext.toString('base64url'),
    cipher.getAuthTag().toString('base64url')
  ].join('.')
}

export function decryptVippsLoginJson<T>(
  token: string,
  purpose: VippsLoginTokenPurpose,
  rootKey: Buffer,
  schema: z.ZodType<T>
) {
  const [version, ivPart, ciphertextPart, tagPart] =
    token.split('.')
  if (
    version !== VERSION ||
    !ivPart ||
    !ciphertextPart ||
    !tagPart
  ) {
    throw new Error('vipps_login_token_invalid')
  }

  const iv = decodeCanonicalBase64Url(ivPart)
  const ciphertext = decodeCanonicalBase64Url(ciphertextPart)
  const tag = decodeCanonicalBase64Url(tagPart)
  if (iv.length !== IV_BYTES || tag.length !== 16) {
    throw new Error('vipps_login_token_invalid')
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    deriveKey(rootKey, purpose),
    iv
  )
  decipher.setAAD(additionalAuthenticatedData(purpose))
  decipher.setAuthTag(tag)

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]).toString('utf8')

  return schema.parse(JSON.parse(plaintext))
}
