import {
  createCipheriv,
  createHmac,
  hkdfSync,
  randomBytes
} from 'node:crypto'

import { z } from 'zod'

export type ProtectedAbandonedCheckoutRecoveryDeliveryAudit = {
  recipientCiphertext: string
  recipientFingerprint: string
  recoveryUrlCiphertext: string
  recoveryUrlFingerprint: string
}

type ProtectInput = {
  recipient: string
  recoveryUrl: string
}

type ProtectDependencies = {
  key?: Buffer
  randomBytes?: (size: number) => Buffer
}

const inputSchema = z.strictObject({
  recipient: z.string().trim().email().max(320),
  recoveryUrl: z.string().url().max(4096)
})

const AUDIT_KEY_BYTES = 32
const IV_BYTES = 12
const KEY_INFO = Buffer.from(
  'utekos-abandoned-checkout-recovery-audit-v1',
  'utf8'
)

function getAuditKey(): Buffer {
  const encoded =
    process.env.ABANDONED_CHECKOUT_RECOVERY_AUDIT_KEY

  if (!encoded) {
    throw new Error(
      'abandoned_checkout_recovery_audit_key_missing'
    )
  }

  const key = Buffer.from(encoded, 'base64')

  if (
    key.length !== AUDIT_KEY_BYTES
    || key.toString('base64').replace(/=+$/u, '')
      !== encoded.replace(/=+$/u, '')
  ) {
    throw new Error(
      'abandoned_checkout_recovery_audit_key_invalid'
    )
  }

  return key
}

function deriveKey(
  rootKey: Buffer,
  purpose: 'encryption' | 'fingerprint'
): Buffer {
  return Buffer.from(
    hkdfSync(
      'sha256',
      rootKey,
      Buffer.alloc(0),
      Buffer.concat([
        KEY_INFO,
        Buffer.from(`:${purpose}`, 'utf8')
      ]),
      AUDIT_KEY_BYTES
    )
  )
}

function encrypt(
  value: string,
  field: 'recipient' | 'recovery_url',
  key: Buffer,
  getRandomBytes: (size: number) => Buffer
): string {
  const iv = getRandomBytes(IV_BYTES)

  if (iv.length !== IV_BYTES) {
    throw new Error(
      'abandoned_checkout_recovery_audit_random_invalid'
    )
  }

  const cipher = createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(
    Buffer.from(`utekos:recovery-audit:v1:${field}`, 'utf8')
  )

  const ciphertext = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final()
  ])
  const tag = cipher.getAuthTag()

  return [
    'v1',
    iv.toString('base64url'),
    ciphertext.toString('base64url'),
    tag.toString('base64url')
  ].join('.')
}

function fingerprint(
  value: string,
  field: 'recipient' | 'recovery_url',
  key: Buffer
): string {
  return createHmac('sha256', key)
    .update(`utekos:recovery-audit:v1:${field}\0`, 'utf8')
    .update(value, 'utf8')
    .digest('hex')
}

export function protectAbandonedCheckoutRecoveryDeliveryAudit(
  input: ProtectInput,
  dependencies: ProtectDependencies = {}
): ProtectedAbandonedCheckoutRecoveryDeliveryAudit {
  const parsed = inputSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(
      'abandoned_checkout_recovery_audit_input_invalid'
    )
  }

  const rootKey = dependencies.key ?? getAuditKey()

  if (rootKey.length !== AUDIT_KEY_BYTES) {
    throw new Error(
      'abandoned_checkout_recovery_audit_key_invalid'
    )
  }

  const encryptionKey = deriveKey(rootKey, 'encryption')
  const fingerprintKey = deriveKey(rootKey, 'fingerprint')
  const getRandomBytes = dependencies.randomBytes ?? randomBytes
  const recipient = parsed.data.recipient.toLowerCase()
  const recoveryUrl = parsed.data.recoveryUrl

  return {
    recipientCiphertext: encrypt(
      recipient,
      'recipient',
      encryptionKey,
      getRandomBytes
    ),
    recipientFingerprint: fingerprint(
      recipient,
      'recipient',
      fingerprintKey
    ),
    recoveryUrlCiphertext: encrypt(
      recoveryUrl,
      'recovery_url',
      encryptionKey,
      getRandomBytes
    ),
    recoveryUrlFingerprint: fingerprint(
      recoveryUrl,
      'recovery_url',
      fingerprintKey
    )
  }
}
