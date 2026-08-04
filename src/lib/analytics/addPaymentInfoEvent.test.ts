import assert from 'node:assert/strict'
import test from 'node:test'
import { deterministicAddPaymentInfoEventId } from './addPaymentInfoEvent'

test('reuses one canonical UUID for replay of the same Shopify source event', () => {
  const first = deterministicAddPaymentInfoEventId(
    'shopify-payment-event-1'
  )

  assert.equal(
    deterministicAddPaymentInfoEventId('shopify-payment-event-1'),
    first
  )
  assert.notEqual(
    deterministicAddPaymentInfoEventId('shopify-payment-event-2'),
    first
  )
  assert.match(
    first,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  )
})
