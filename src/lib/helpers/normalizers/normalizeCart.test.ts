import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  StorefrontCart,
  StorefrontCartProduct
} from '@/api/shopify/types/storefrontApi'
import { normalizeCart } from './normalizeCart'

const money = { amount: '2499.00', currencyCode: 'NOK' } as const

function createStorefrontProduct(): StorefrontCartProduct {
  return {
    id: 'gid://shopify/Product/1',
    title: 'Utekos Comfyrobe',
    handle: 'utekos-comfyrobe',
    vendor: 'Utekos',
    productType: 'Comfyrobe'
  }
}

test('normalizes Storefront cart data without replacing Utekos cart models', () => {
  const storefrontCart: StorefrontCart = {
    id: 'gid://shopify/Cart/opaque?key=server-secret',
    checkoutUrl:
      'https://example.myshopify.com/checkouts/1?key=checkout-key',
    totalQuantity: 1,
    cost: { totalAmount: money, subtotalAmount: money },
    lines: {
      edges: [
        {
          node: {
            id: 'gid://shopify/CartLine/1',
            quantity: 1,
            cost: { totalAmount: money },
            merchandise: {
              id: 'gid://shopify/ProductVariant/1',
              title: 'Medium',
              availableForSale: true,
              selectedOptions: [
                { name: 'Størrelse', value: 'Medium' }
              ],
              price: money,
              compareAtPrice: null,
              image: null,
              product: createStorefrontProduct()
            }
          }
        }
      ]
    }
  }

  const cart = normalizeCart(storefrontCart)

  assert.equal(cart.cost.totalAmount.currencyCode, 'NOK')
  assert.equal(cart.id, 'gid://shopify/Cart/opaque')
  assert.equal(cart.checkoutUrl, '/api/cart/checkout')
  assert.deepEqual(cart.lines[0]?.merchandise.product, {
    id: 'gid://shopify/Product/1',
    title: 'Utekos Comfyrobe',
    handle: 'utekos-comfyrobe',
    vendor: 'Utekos',
    productType: 'Comfyrobe'
  })
})
