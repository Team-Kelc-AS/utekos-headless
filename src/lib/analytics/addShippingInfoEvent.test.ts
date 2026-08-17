import assert from 'node:assert/strict'
import test from 'node:test'
import { deterministicAddShippingInfoEventId } from './addShippingInfoEvent'

test('reuses one canonical UUID for replay of the same Shopify shipping event', () => {
  const first = deterministicAddShippingInfoEventId(
    'shopify-shipping-event-1'
  )

  assert.equal(
    deterministicAddShippingInfoEventId('shopify-shipping-event-1'),
    first
  )
  assert.notEqual(
    deterministicAddShippingInfoEventId('shopify-shipping-event-2'),
    first
  )
  assert.match(
    first,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  )
})
