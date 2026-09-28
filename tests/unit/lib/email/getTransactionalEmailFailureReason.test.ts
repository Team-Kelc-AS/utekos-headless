import assert from 'node:assert/strict'
import test from 'node:test'

import { getTransactionalEmailFailureReason } from '@/lib/email/getTransactionalEmailFailureReason'

test('classifies a reused idempotency key as an existing registration', () => {
  assert.equal(
    getTransactionalEmailFailureReason({
      name: 'invalid_idempotent_request'
    }),
    'already_registered'
  )
})

test('keeps unrelated Resend failures generic', () => {
  assert.equal(
    getTransactionalEmailFailureReason({
      name: 'rate_limit_exceeded'
    }),
    'provider_rejected'
  )
})
