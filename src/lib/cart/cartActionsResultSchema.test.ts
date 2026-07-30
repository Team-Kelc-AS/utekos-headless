import assert from 'node:assert/strict'
import test from 'node:test'

import { cartActionsResultSchema } from './cartActionsResultSchema'

const cartResult = {
  success: true,
  message: 'ok',
  cart: {
    id: 'gid://shopify/Cart/public-token',
    checkoutUrl: '/api/cart/checkout',
    totalQuantity: 0,
    cost: {
      totalAmount: { amount: '0.00', currencyCode: 'NOK' },
      subtotalAmount: { amount: '0.00', currencyCode: 'NOK' }
    },
    lines: []
  }
}

test('accepts only the keyless public cart identity at the client boundary', () => {
  assert.equal(
    cartActionsResultSchema.safeParse(cartResult).success,
    true
  )
})

test('rejects an authenticated Shopify cart id at the client boundary', () => {
  const result = cartActionsResultSchema.safeParse({
    ...cartResult,
    cart: {
      ...cartResult.cart,
      id: `${cartResult.cart.id}?key=server-secret`
    }
  })

  assert.equal(result.success, false)
})
