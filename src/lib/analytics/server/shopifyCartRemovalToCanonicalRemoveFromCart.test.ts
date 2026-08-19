import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deterministicRemoveFromCartEventId,
  shopifyCartRemovalToCanonicalRemoveFromCart
} from './shopifyCartRemovalToCanonicalRemoveFromCart'

test('maps cart removal to webhook remove_from_cart with commerce', async () => {
  const event = await shopifyCartRemovalToCanonicalRemoveFromCart({
    cartToken: 'exampleCartId',
    quantityRemoved: 2,
    updatedAt: '2026-07-24T12:00:00.000Z',
    priorLine: {
      price: '1590.00',
      product_id: '788032119674292922',
      quantity: 3,
      title: 'Example T-Shirt - Small',
      variant_id: '704912205188288575',
      currency_code: 'NOK',
      taxable: true,
      sku: 'example-shirt-s',
      vendor: 'Utekos'
    }
  })

  assert.equal(event.event_name, 'remove_from_cart')
  assert.equal(event.source, 'webhook')
  assert.equal(event.custom_data.currency, 'NOK')
  assert.equal(event.custom_data.items[0]?.quantity, 2)
  assert.equal(event.custom_data.gross_value, 3180)
  assert.ok(event.custom_data.cart_mutation_id.startsWith('cart_mut_'))
  assert.equal(
    event.event_id,
    deterministicRemoveFromCartEventId({
      cartToken: 'exampleCartId',
      quantityRemoved: 2,
      updatedAt: '2026-07-24T12:00:00.000Z',
      variantId: '704912205188288575'
    })
  )
})

test('deterministic event id is stable for same removal key', () => {
  const first = deterministicRemoveFromCartEventId({
    cartToken: 'cart-a',
    quantityRemoved: 1,
    updatedAt: '2026-07-24T12:00:00.000Z',
    variantId: '111'
  })
  const second = deterministicRemoveFromCartEventId({
    cartToken: 'cart-a',
    quantityRemoved: 1,
    updatedAt: '2026-07-24T12:00:00.000Z',
    variantId: '111'
  })

  assert.equal(first, second)
})
