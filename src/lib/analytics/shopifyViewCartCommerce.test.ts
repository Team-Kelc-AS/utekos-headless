import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mapShopifyViewCart,
  nextViewCartSequence
} from './shopifyViewCartCommerce'
import type { Cart } from 'types/cart'

const cart = {
  id: 'gid://shopify/Cart/abc123',
  checkoutUrl: 'https://checkout.shopify.com/c/token-1',
  totalQuantity: 1,
  cost: {
    subtotalAmount: { amount: '1790.0', currencyCode: 'NOK' },
    totalAmount: { amount: '1790.0', currencyCode: 'NOK' },
    totalTaxAmount: { amount: '358.0', currencyCode: 'NOK' }
  },
  lines: [
    {
      id: 'gid://shopify/CartLine/1',
      quantity: 1,
      cost: {
        totalAmount: { amount: '1790.0', currencyCode: 'NOK' },
        amountPerQuantity: { amount: '1790.0', currencyCode: 'NOK' },
        compareAtAmountPerQuantity: null
      },
      merchandise: {
        id: 'gid://shopify/ProductVariant/46944403882232',
        title: 'Default',
        availableForSale: true,
        selectedOptions: [],
        price: { amount: '1790.0', currencyCode: 'NOK' },
        compareAtPrice: null,
        image: null,
        product: {
          id: 'gid://shopify/Product/456',
          handle: 'utekos-techdown',
          title: 'Utekos TechDown',
          vendor: 'Utekos',
          productType: 'Yttertøy',
          collections: { nodes: [] },
          options: [],
          variants: { nodes: [] },
          featuredImage: null,
          priceRange: {
            minVariantPrice: { amount: '1790.0', currencyCode: 'NOK' },
            maxVariantPrice: { amount: '1790.0', currencyCode: 'NOK' }
          }
        }
      }
    }
  ]
} as unknown as Cart

test('mapShopifyViewCart carries cart_id and view_sequence onto commerce', () => {
  const customData = mapShopifyViewCart(cart, 3)

  assert.equal(customData.cart_id, cart.id)
  assert.equal(customData.view_sequence, 3)
  assert.equal(customData.currency, 'NOK')
  assert.equal(customData.gross_value, 1790)
  assert.equal(customData.items.length, 1)
  assert.equal(
    customData.items[0]?.variant_id,
    'gid://shopify/ProductVariant/46944403882232'
  )
  assert.equal(customData.items[0]?.taxable, true)
})

test('nextViewCartSequence increments monotonically', () => {
  assert.equal(nextViewCartSequence(), 1)
  assert.equal(nextViewCartSequence(), 2)
})
