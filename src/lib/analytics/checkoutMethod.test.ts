import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CHECKOUT_METHOD_HEADER,
  readCheckoutMethod
} from './checkoutMethod'

test('reads supported checkout methods from the collector header', () => {
  const headers = new Headers({
    [CHECKOUT_METHOD_HEADER]: 'klarna_express'
  })

  assert.equal(readCheckoutMethod(headers), 'klarna_express')
})

test('defaults missing or invalid checkout methods to Shopify checkout', () => {
  assert.equal(readCheckoutMethod(new Headers()), 'shopify_checkout')
  assert.equal(
    readCheckoutMethod(
      new Headers({ [CHECKOUT_METHOD_HEADER]: 'unexpected' })
    ),
    'shopify_checkout'
  )
})
