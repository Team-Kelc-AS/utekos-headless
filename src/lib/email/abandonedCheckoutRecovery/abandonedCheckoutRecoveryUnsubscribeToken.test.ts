import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAbandonedCheckoutRecoveryUnsubscribeToken,
  verifyAbandonedCheckoutRecoveryUnsubscribeToken
} from './abandonedCheckoutRecoveryUnsubscribeToken'

const dispatchId = '8d5dce25-4ed0-4ee5-9629-80eb99d1f24d'

test('unsubscribe token round-trips without customer PII', () => {
  const previous = process.env.EMAIL_UNSUBSCRIBE_SECRET
  process.env.EMAIL_UNSUBSCRIBE_SECRET = 's'.repeat(32)

  try {
    const token =
      createAbandonedCheckoutRecoveryUnsubscribeToken(dispatchId)

    assert.equal(token.includes('@'), false)
    assert.equal(
      verifyAbandonedCheckoutRecoveryUnsubscribeToken(token),
      dispatchId
    )
  } finally {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = previous
  }
})

test('unsubscribe token rejects tampering', () => {
  const previous = process.env.EMAIL_UNSUBSCRIBE_SECRET
  process.env.EMAIL_UNSUBSCRIBE_SECRET = 's'.repeat(32)

  try {
    const token =
      createAbandonedCheckoutRecoveryUnsubscribeToken(dispatchId)
    const separator = token.lastIndexOf('.')
    const firstSignatureCharacter = token[separator + 1]
    const replacement = firstSignatureCharacter === 'A' ? 'B' : 'A'
    const tampered =
      `${token.slice(0, separator + 1)}${replacement}${token.slice(separator + 2)}`

    assert.equal(
      verifyAbandonedCheckoutRecoveryUnsubscribeToken(tampered),
      null
    )
  } finally {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = previous
  }
})
