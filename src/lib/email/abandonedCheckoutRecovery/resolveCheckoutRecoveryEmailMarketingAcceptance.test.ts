import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveCheckoutRecoveryEmailMarketingAcceptance } from './resolveCheckoutRecoveryEmailMarketingAcceptance'

const input = {
  beginCheckoutEventId:
    '71c2ef59-6e6f-4f56-a63a-567ca398f9de',
  email: 'app@utekos.no',
  checkoutCreatedAt: '2026-08-22T07:30:00.000Z',
  now: new Date('2026-08-22T08:00:00.000Z')
}

test('returns the latest exact checkout/email acceptance', async () => {
  const result = await resolveCheckoutRecoveryEmailMarketingAcceptance(
    input,
    {
      protectEmail: email => {
        assert.equal(email, 'app@utekos.no')
        return 'a'.repeat(64)
      },
      queryLatest: async query => {
        assert.equal(query.beginCheckoutEventId, input.beginCheckoutEventId)
        assert.equal(query.recipientFingerprint, 'a'.repeat(64))
        assert.equal(query.checkoutCreatedAt, input.checkoutCreatedAt)
        assert.equal(query.now, input.now.toISOString())
        return { buyerAcceptsEmailMarketing: true }
      }
    }
  )

  assert.equal(result, true)
})

test('fails closed for missing or withdrawn evidence', async () => {
  for (const row of [
    null,
    { buyerAcceptsEmailMarketing: false }
  ] as const) {
    assert.equal(
      await resolveCheckoutRecoveryEmailMarketingAcceptance(input, {
        protectEmail: () => 'a'.repeat(64),
        queryLatest: async () => row
      }),
      false
    )
  }
})
