import assert from 'node:assert/strict'
import test from 'node:test'
import type { StorefrontProduct } from '@/api/shopify/types/storefrontApi'
import { reshapeProduct } from './reshapeProduct'

const money = { amount: '2499.00', currencyCode: 'NOK' } as const

function createStorefrontProduct(): StorefrontProduct {
  return {
    id: 'gid://shopify/Product/1',
    title: 'Utekos Comfyrobe',
    tags: ['comfyrobe'],
    handle: 'utekos-comfyrobe',
    totalInventory: 4,
    updatedAt: '2026-07-26T00:00:00Z',
    productType: 'Comfyrobe',
    vendor: 'Utekos',
    availableForSale: true,
    description: 'Varm og vindtett.',
    collections: {
      nodes: [
        {
          id: 'gid://shopify/Collection/1',
          title: 'Comfyrobe',
          handle: 'comfyrobe'
        }
      ]
    },
    compareAtPriceRange: {
      minVariantPrice: money,
      maxVariantPrice: money
    },
    priceRange: {
      minVariantPrice: money,
      maxVariantPrice: money
    },
    options: [
      {
        name: 'Størrelse',
        optionValues: [{ name: 'Medium' }]
      }
    ],
    featuredImage: null,
    images: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductImage/1',
            url: 'https://cdn.shopify.com/product.jpg',
            altText: null,
            width: null,
            height: null
          }
        }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/1',
            title: 'Medium',
            barcode: '0700000000001',
            availableForSale: true,
            currentlyNotInStock: false,
            taxable: true,
            selectedOptions: [{ name: 'Størrelse', value: 'Medium' }],
            quantityAvailable: 4,
            sku: 'COMFY-M',
            price: money,
            compareAtPrice: null,
            image: null,
            metafield: {
              reference: {
                subtitle: {
                  key: 'subtitle',
                  value: 'Vargnatt',
                  type: 'single_line_text_field'
                }
              }
            }
          }
        }
      ]
    },
    seo: {
      title: 'Comfyrobe fra Utekos',
      description: null
    }
  }
}

test('normalizes a Storefront product into the enriched Utekos domain', () => {
  const product = reshapeProduct(createStorefrontProduct())
  const variant = product.variants.edges[0]?.node

  assert.equal(product.featuredImage?.url, '/placeholder-image.png')
  assert.equal(product.featuredImage?.altText, 'Bilde av Utekos Comfyrobe')
  assert.equal(product.images.edges[0]?.node.image.width, 1024)
  assert.equal(product.selectedOrFirstAvailableVariant?.id, variant?.id)
  assert.equal(variant?.variantProfileData?.subtitle?.value, 'Vargnatt')
  assert.equal(variant?.metafield?.namespace, 'bridgeFor')
  assert.equal(variant?.weight, null)
  assert.equal(variant?.weightUnit, 'GRAMS')
  assert.equal(product.description, 'Varm og vindtett.')
})
