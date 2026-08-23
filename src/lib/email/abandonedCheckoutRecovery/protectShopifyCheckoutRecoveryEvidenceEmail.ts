import { createHmac, hkdfSync } from 'node:crypto'

import { z } from 'zod'

const ROOT_KEY_BYTES = 32
const KEY_INFO = Buffer.from(
  'utekos-shopify-checkout-recovery-evidence-email-v1',
  'utf8'
)

type Dependencies = {
  key?: Buffer
}

function getRootKey(): Buffer {
  const encoded =
    process.env.ABANDONED_CHECKOUT_RECOVERY_AUDIT_KEY

  if (!encoded) {
    throw new Error('checkout_recovery_evidence_key_missing')
  }

  const key = Buffer.from(encoded, 'base64')

  if (
    key.length !== ROOT_KEY_BYTES
    || key.toString('base64').replace(/=+$/u, '')
      !== encoded.replace(/=+$/u, '')
  ) {
    throw new Error('checkout_recovery_evidence_key_invalid')
  }

  return key
}

export function protectShopifyCheckoutRecoveryEvidenceEmail(
  email: string,
  dependencies: Dependencies = {}
): string {
  const parsed = z
    .email()
    .max(320)
    .safeParse(email.trim().toLowerCase())

  if (!parsed.success) {
    throw new Error('checkout_recovery_evidence_email_invalid')
  }

  const rootKey = dependencies.key ?? getRootKey()

  if (rootKey.length !== ROOT_KEY_BYTES) {
    throw new Error('checkout_recovery_evidence_key_invalid')
  }

  const fingerprintKey = Buffer.from(
    hkdfSync(
      'sha256',
      rootKey,
      Buffer.alloc(0),
      KEY_INFO,
      ROOT_KEY_BYTES
    )
  )

  return createHmac('sha256', fingerprintKey)
    .update('utekos:checkout-recovery-evidence:v1:email\0', 'utf8')
    .update(parsed.data, 'utf8')
    .digest('hex')
}
