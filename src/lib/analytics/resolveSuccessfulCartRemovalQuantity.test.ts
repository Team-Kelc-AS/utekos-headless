import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSuccessfulCartRemovalQuantity } from './resolveSuccessfulCartRemovalQuantity'
import type { Cart } from 'types/cart/Cart'
import type { CartActionsResult } from 'types/cart/CartActions'

function result(
  quantity: number | null,
  success = true
): CartActionsResult {
  return {
    success,
    message: success ? 'ok' : 'Shopify rejected mutation',
    cart: {
      id: 'gid://shopify/Cart/abc',
      checkoutUrl: 'https://checkout.shopify.com/abc',
      totalQuantity: quantity ?? 0,
      cost: {
        totalAmount: { amount: '0', currencyCode: 'NOK' },
        subtotalAmount: { amount: '0', currencyCode: 'NOK' }
      },
      lines:
        quantity === null ?
          []
        : [
            {
              id: 'line-1',
              quantity
            }
          ]
    } as unknown as Cart
  }
}

test('reports the full authoritative quantity for a deleted line', () => {
  assert.equal(
    resolveSuccessfulCartRemovalQuantity({
      lineId: 'line-1',
      previousQuantity: 3,
      result: result(null)
    }),
    3
  )
})

test('reports one item for a successful 1 to 0 transition', () => {
  assert.equal(
    resolveSuccessfulCartRemovalQuantity({
      lineId: 'line-1',
      previousQuantity: 1,
      result: result(null)
    }),
    1
  )
})

test('reports the actual one-item delta for a successful 3 to 2 update', () => {
  assert.equal(
    resolveSuccessfulCartRemovalQuantity({
      lineId: 'line-1',
      previousQuantity: 3,
      result: result(2)
    }),
    1
  )
})

test('coalesces several rapid decrements into Shopify actual 3 to 1 delta', () => {
  assert.equal(
    resolveSuccessfulCartRemovalQuantity({
      lineId: 'line-1',
      previousQuantity: 3,
      result: result(1)
    }),
    2
  )
})

test('reports nothing after a Shopify failure or a quantity increase', () => {
  assert.equal(
    resolveSuccessfulCartRemovalQuantity({
      lineId: 'line-1',
      previousQuantity: 3,
      result: result(2, false)
    }),
    0
  )
  assert.equal(
    resolveSuccessfulCartRemovalQuantity({
      lineId: 'line-1',
      previousQuantity: 3,
      result: result(4)
    }),
    0
  )
})
