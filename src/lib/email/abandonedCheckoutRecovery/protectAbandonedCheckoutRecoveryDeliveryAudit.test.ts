import assert from 'node:assert/strict'
import test from 'node:test'

import {
  protectAbandonedCheckoutRecoveryDeliveryAudit
} from './protectAbandonedCheckoutRecoveryDeliveryAudit'

const KEY = Buffer.alloc(32, 7)

test('protects recipient and recovery URL without plaintext leakage', () => {
  const recipient = 'kunde@example.com'
  const recoveryUrl =
    'https://checkout.example/checkouts/cn/secret-token/recover'

  const protectedAudit =
    protectAbandonedCheckoutRecoveryDeliveryAudit(
      { recipient, recoveryUrl },
      {
        key: KEY,
        randomBytes: size => Buffer.alloc(size, 3)
      }
    )

  const serialized = JSON.stringify(protectedAudit)

  assert.doesNotMatch(serialized, /kunde@example\.com/u)
  assert.doesNotMatch(serialized, /secret-token/u)
  assert.match(protectedAudit.recipientCiphertext, /^v1\./u)
  assert.match(protectedAudit.recoveryUrlCiphertext, /^v1\./u)
  assert.match(protectedAudit.recipientFingerprint, /^[a-f0-9]{64}$/u)
  assert.match(protectedAudit.recoveryUrlFingerprint, /^[a-f0-9]{64}$/u)
})

test('normalizes only the recipient before fingerprinting', () => {
  const dependencies = {
    key: KEY,
    randomBytes: (size: number) => Buffer.alloc(size, 5)
  }
  const recoveryUrl = 'https://checkout.example/recover?token=CaseSensitive'

  const first = protectAbandonedCheckoutRecoveryDeliveryAudit(
    { recipient: ' Kunde@Example.COM ', recoveryUrl },
    dependencies
  )
  const second = protectAbandonedCheckoutRecoveryDeliveryAudit(
    { recipient: 'kunde@example.com', recoveryUrl },
    dependencies
  )

  assert.equal(
    first.recipientFingerprint,
    second.recipientFingerprint
  )
  assert.equal(
    first.recoveryUrlFingerprint,
    second.recoveryUrlFingerprint
  )
})

test('fails closed when the audit key has the wrong length', () => {
  assert.throws(
    () => protectAbandonedCheckoutRecoveryDeliveryAudit(
      {
        recipient: 'kunde@example.com',
        recoveryUrl: 'https://checkout.example/recover'
      },
      { key: Buffer.alloc(16) }
    ),
    /audit_key_invalid/u
  )
})
