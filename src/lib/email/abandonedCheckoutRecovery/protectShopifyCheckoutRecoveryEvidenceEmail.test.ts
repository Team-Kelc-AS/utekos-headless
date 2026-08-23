import assert from 'node:assert/strict'
import test from 'node:test'

import { protectShopifyCheckoutRecoveryEvidenceEmail } from './protectShopifyCheckoutRecoveryEvidenceEmail'

const key = Buffer.alloc(32, 7)

test('normalizes and creates a keyed, stable email fingerprint', () => {
  const first = protectShopifyCheckoutRecoveryEvidenceEmail(
    ' App@Utekos.no ',
    { key }
  )
  const second = protectShopifyCheckoutRecoveryEvidenceEmail(
    'app@utekos.no',
    { key }
  )

  assert.match(first, /^[a-f0-9]{64}$/u)
  assert.equal(first, second)
  assert.equal(first.includes('app'), false)
})

test('fails closed for invalid email and key material', () => {
  assert.throws(
    () => protectShopifyCheckoutRecoveryEvidenceEmail('invalid', { key }),
    { message: 'checkout_recovery_evidence_email_invalid' }
  )
  assert.throws(
    () => protectShopifyCheckoutRecoveryEvidenceEmail(
      'app@utekos.no',
      { key: Buffer.alloc(31) }
    ),
    { message: 'checkout_recovery_evidence_key_invalid' }
  )
})
