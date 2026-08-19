import assert from 'node:assert/strict'
import test from 'node:test'
import { mapShopifyRemoveFromCart } from './shopifyRemoveFromCartCommerce'
import type { CartProductVariant } from 'types/cart/CartProductVariant'
import type { CartProduct } from 'types/cart'

const product = {
  id: 'gid://shopify/Product/456',
  handle: 'utekos-techdown',
  title: 'Utekos TechDown',
  vendor: 'Utekos',
  productType: 'Yttertøy'
} satisfies CartProduct

const variant = {
  id: 'gid://shopify/ProductVariant/46944403882232',
  title: 'Default',
  availableForSale: true,
  selectedOptions: [],
  price: { amount: '1790.0', currencyCode: 'NOK' },
  compareAtPrice: null,
  image: null,
  product
} as unknown as CartProductVariant

test('mapShopifyRemoveFromCart carries cart_id, mutation id, and commerce', async () => {
  const customData = await mapShopifyRemoveFromCart({
    cartId: 'gid://shopify/Cart/abc123',
    mutationTimestamp: '2026-07-24T12:00:00.000Z',
    product,
    quantity: 2,
    variant
  })

  assert.equal(customData.cart_id, 'gid://shopify/Cart/abc123')
  assert.equal(
    customData.cart_mutation_id,
    'cart_mut_4561bb2f26f6e1771d3b7fcf9a6407e9'
  )
  assert.equal(customData.currency, 'NOK')
  assert.equal(customData.gross_value, 3580)
  assert.equal(customData.items.length, 1)
  assert.equal(
    customData.items[0]?.variant_id,
    'gid://shopify/ProductVariant/46944403882232'
  )
  assert.equal(customData.items[0]?.quantity, 2)
  assert.equal(customData.items[0]?.taxable, true)
  assert.equal(customData.items[0]?.item_brand, 'Utekos')
  assert.equal(customData.items[0]?.item_category, 'Yttertøy')
  assert.deepEqual(customData.items[0]?.collection_ids, [])
})
