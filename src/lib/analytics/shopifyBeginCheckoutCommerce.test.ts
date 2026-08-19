import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCheckoutCreationRevision,
  mapShopifyBeginCheckout
} from './shopifyBeginCheckoutCommerce'
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
          productType: 'Yttertøy'
        }
      }
    }
  ]
} as unknown as Cart

test('createCheckoutCreationRevision uses SHA-256 over UTF-8 material', async () => {
  assert.equal(
    await createCheckoutCreationRevision(
      'token-1',
      'https://checkout.shopify.com/c/token-1'
    ),
    'checkout_rev_807451af60e366214651a5f336158091'
  )
})

test('mapShopifyBeginCheckout attaches the Web Crypto revision', async () => {
  const commerce = await mapShopifyBeginCheckout(cart)

  assert.equal(commerce.checkout_id, 'token-1')
  assert.equal(
    commerce.creation_revision,
    'checkout_rev_807451af60e366214651a5f336158091'
  )
  assert.equal(commerce.gross_value, 1790)
})
