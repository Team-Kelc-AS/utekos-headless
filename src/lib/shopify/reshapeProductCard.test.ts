import assert from 'node:assert/strict'
import test from 'node:test'
import type { StorefrontProductCard } from '@/api/shopify/types/storefrontApi'
import { reshapeProductCard } from './reshapeProductCard'

test('maps a minimal product-card payload without PDP-only fields', () => {
  const product: StorefrontProductCard = {
    id: 'gid://shopify/Product/1',
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    productType: 'Comfyrobe',
    vendor: 'Utekos',
    availableForSale: true,
    featuredImage: {
      id: 'gid://shopify/ProductImage/1',
      url: 'https://cdn.shopify.com/product.jpg',
      altText: 'Utekos TechDown',
      width: 1600,
      height: 2000
    },
    collections: {
      nodes: [{ id: 'gid://shopify/Collection/1', title: 'Comfyrobe' }]
    },
    priceRange: {
      minVariantPrice: { amount: '1790.00', currencyCode: 'NOK' }
    },
    options: [
      {
        name: 'Størrelse',
        optionValues: [{ name: 'Middels' }]
      }
    ],
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/1',
            title: 'Middels',
            barcode: null,
            availableForSale: true,
            currentlyNotInStock: false,
            taxable: true,
            selectedOptions: [{ name: 'Størrelse', value: 'Middels' }],
            price: { amount: '1790.00', currencyCode: 'NOK' },
            compareAtPrice: null,
            image: null,
            sku: 'TD-M',
            quantityAvailable: 4
          }
        }
      ]
    }
  }

  const card = reshapeProductCard(product)

  assert.equal(card.handle, 'utekos-techdown')
  assert.equal(card.priceRange.minVariantPrice.amount, '1790.00')
  assert.equal(card.featuredImage?.url, 'https://cdn.shopify.com/product.jpg')
  assert.equal(card.variants.edges[0]?.node.availableForSale, true)
  assert.equal(card.variants.edges[0]?.node.sku, 'TD-M')
  assert.equal(
    'seo' in card || 'description' in card || 'relatedProducts' in card,
    false
  )
})
