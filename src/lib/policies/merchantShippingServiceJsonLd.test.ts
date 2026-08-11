import assert from 'node:assert/strict'
import test from 'node:test'
import { merchantShippingServiceJsonLd } from './merchantShippingServiceJsonLd'

test('models the global Norwegian 99/0 kroner shipping thresholds', () => {
  const [paidShipping, freeShipping] =
    merchantShippingServiceJsonLd.shippingConditions

  assert.deepEqual(paidShipping.orderValue, {
    '@type': 'MonetaryAmount',
    currency: 'NOK',
    minValue: 0,
    maxValue: 998.99
  })
  assert.deepEqual(paidShipping.shippingRate, {
    '@type': 'MonetaryAmount',
    value: 99,
    currency: 'NOK'
  })
  assert.deepEqual(freeShipping.orderValue, {
    '@type': 'MonetaryAmount',
    currency: 'NOK',
    minValue: 999
  })
  assert.deepEqual(freeShipping.shippingRate, {
    '@type': 'MonetaryAmount',
    value: 0,
    currency: 'NOK'
  })
  assert.deepEqual(paidShipping.transitTime.duration, {
    '@type': 'QuantitativeValue',
    minValue: 2,
    maxValue: 5,
    unitCode: 'DAY'
  })
})
