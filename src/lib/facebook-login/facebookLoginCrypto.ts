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
const KEY_INFO = Buffer.from('utekos-facebook-login-v1', 'utf8')

type TokenPurpose =
  | 'oauth-state'
  | 'identity-cookie'
  | 'email'
  | 'phone'

function deriveKey(rootKey: Buffer, purpose: TokenPurpose) {
  if (rootKey.length !== KEY_BYTES) {
    throw new Error('facebook_login_identity_key_invalid')
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

function aad(purpose: TokenPurpose) {
  return Buffer.from(
    `utekos:facebook-login:${VERSION}:${purpose}`,
    'utf8'
  )
}

export function encryptFacebookLoginValue(
  value: string,
  purpose: TokenPurpose,
  rootKey: Buffer,
  getRandomBytes: (size: number) => Buffer = randomBytes
) {
  const iv = getRandomBytes(IV_BYTES)
  if (iv.length !== IV_BYTES) {
    throw new Error('facebook_login_random_invalid')
  }

  const cipher = createCipheriv(
    'aes-256-gcm',
    deriveKey(rootKey, purpose),
    iv
  )
  cipher.setAAD(aad(purpose))

  const ciphertext = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final()
  ])

  return [
    VERSION,
    iv.toString('base64url'),
    ciphertext.toString('base64url'),
    cipher.getAuthTag().toString('base64url')
  ].join('.')
}

export function decryptFacebookLoginValue(
  token: string,
  purpose: TokenPurpose,
  rootKey: Buffer
) {
  const [version, ivPart, ciphertextPart, tagPart] =
    token.split('.')

  if (
    version !== VERSION ||
    !ivPart ||
    !ciphertextPart ||
    !tagPart
  ) {
    throw new Error('facebook_login_token_invalid')
  }

  const iv = Buffer.from(ivPart, 'base64url')
  const tag = Buffer.from(tagPart, 'base64url')
  if (iv.length !== IV_BYTES || tag.length !== 16) {
    throw new Error('facebook_login_token_invalid')
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    deriveKey(rootKey, purpose),
    iv
  )
  decipher.setAAD(aad(purpose))
  decipher.setAuthTag(tag)

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, 'base64url')),
    decipher.final()
  ]).toString('utf8')
}

export function encryptFacebookLoginJson<T>(
  value: T,
  purpose: Extract<
    TokenPurpose,
    'oauth-state' | 'identity-cookie'
  >,
  rootKey: Buffer,
  getRandomBytes?: (size: number) => Buffer
) {
  return encryptFacebookLoginValue(
    JSON.stringify(value),
    purpose,
    rootKey,
    getRandomBytes
  )
}

export function decryptFacebookLoginJson<T>(
  token: string,
  purpose: Extract<
    TokenPurpose,
    'oauth-state' | 'identity-cookie'
  >,
  rootKey: Buffer,
  schema: z.ZodType<T>
) {
  return schema.parse(
    JSON.parse(
      decryptFacebookLoginValue(token, purpose, rootKey)
    )
  )
}
