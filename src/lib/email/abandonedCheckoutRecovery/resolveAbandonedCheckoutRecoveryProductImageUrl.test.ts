import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveAbandonedCheckoutRecoveryProductImageUrl } from './resolveAbandonedCheckoutRecoveryProductImageUrl'

test('returns null for an unknown product handle', () => {
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl('comfyrobe'),
    null
  )
})

test('returns a first-party URL for an allowlisted handle', () => {
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl('comfyrobe', {
      comfyrobe: '/email/abandoned-checkout/comfyrobe.jpg'
    }),
    'https://utekos.no/email/abandoned-checkout/comfyrobe.jpg'
  )
})

test('returns null for a missing handle or an unsafe mapped path', () => {
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl(null, {
      comfyrobe: '/email/abandoned-checkout/comfyrobe.jpg'
    }),
    null
  )
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl('comfyrobe', {
      comfyrobe: 'https://cdn.shopify.com/s/files/1/product.jpg'
    }),
    null
  )
  assert.equal(
    resolveAbandonedCheckoutRecoveryProductImageUrl('comfyrobe', {
      comfyrobe: '/email/abandoned-checkout/../secret.jpg'
    }),
    null
  )
})
