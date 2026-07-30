import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  StorefrontCart,
  StorefrontProduct
} from '@/api/shopify/types/storefrontApi'
import { normalizeCart } from './normalizeCart'

const money = { amount: '2499.00', currencyCode: 'NOK' } as const

function createStorefrontProduct(): StorefrontProduct {
  return {
    id: 'gid://shopify/Product/1',
    title: 'Utekos Comfyrobe',
    tags: [],
    handle: 'utekos-comfyrobe',
    totalInventory: 1,
    updatedAt: '2026-07-26T00:00:00Z',
    productType: 'Comfyrobe',
    vendor: 'Utekos',
    availableForSale: true,
    description: 'Varm og vindtett.',
    collections: { nodes: [] },
    compareAtPriceRange: {
      minVariantPrice: money,
      maxVariantPrice: money
    },
    priceRange: {
      minVariantPrice: money,
      maxVariantPrice: money
    },
    options: [],
    featuredImage: null,
    images: { edges: [] },
    variants: { edges: [] },
    seo: { title: null, description: null }
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
  assert.equal(
    cart.lines[0]?.merchandise.product.featuredImage.url,
    '/placeholder-image.png'
  )
  assert.equal(
    'relatedProducts' in cart.lines[0]!.merchandise.product,
    false
  )
})
