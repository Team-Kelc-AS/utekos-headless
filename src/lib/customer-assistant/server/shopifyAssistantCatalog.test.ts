import assert from 'node:assert/strict'
import test from 'node:test'
import {
  fetchAssistantProducts,
  normalizeAssistantProduct
} from './shopifyAssistantCatalog'

const rawProduct = {
  id: 'gid://shopify/Product/1',
  handle: 'utekos-techdown',
  title: 'Utekos TechDown',
  featuredImage: {
    altText: 'TechDown på bryggen',
    url: 'https://cdn.shopify.com/techdown.jpg'
  },
  priceRange: {
    minVariantPrice: { amount: '2490.00', currencyCode: 'NOK' }
  },
  variants: {
    edges: [
      {
        node: {
          id: 'gid://shopify/ProductVariant/1',
          title: 'Small / Navy',
          availableForSale: true,
          selectedOptions: [
            { name: 'Size', value: 'Small' },
            { name: 'Color', value: 'Navy' }
          ]
        }
      },
      {
        node: {
          id: 'gid://shopify/ProductVariant/2',
          title: 'Large / Navy',
          availableForSale: false,
          selectedOptions: [
            { name: 'Size', value: 'Large' },
            { name: 'Color', value: 'Navy' }
          ]
        }
      }
    ]
  }
}

test('normalizes the minimum product truth without inventory quantities', () => {
  const product = normalizeAssistantProduct(rawProduct)

  assert.deepEqual(product, {
    id: 'gid://shopify/Product/1',
    handle: 'utekos-techdown',
    title: 'Utekos TechDown',
    href: '/produkter/utekos-techdown',
    image: {
      alt: 'TechDown på bryggen',
      url: 'https://cdn.shopify.com/techdown.jpg'
    },
    price: { amount: '2490.00', currencyCode: 'NOK' },
    variants: [
      {
        id: 'gid://shopify/ProductVariant/1',
        title: 'Small / Navy',
        availableForSale: true,
        selectedOptions: [
          { name: 'Size', value: 'Small' },
          { name: 'Color', value: 'Navy' }
        ]
      },
      {
        id: 'gid://shopify/ProductVariant/2',
        title: 'Large / Navy',
        availableForSale: false,
        selectedOptions: [
          { name: 'Size', value: 'Large' },
          { name: 'Color', value: 'Navy' }
        ]
      }
    ]
  })

  assert.equal(
    'quantityAvailable' in product.variants[0]!,
    false
  )
  assert.equal(
    'quantityAvailable' in product.variants[1]!,
    false
  )
})

test('normalizes a missing featured image as null', () => {
  assert.equal(
    normalizeAssistantProduct({
      ...rawProduct,
      featuredImage: null
    }).image,
    null
  )
})

test('passes an explicit buyer IP and bounded handle query to Shopify', async () => {
  let request: unknown

  const products = await fetchAssistantProducts(
    {
      buyerIp: '203.0.113.8',
      handles: ['utekos-techdown', 'comfyrobe']
    },
    async input => {
      request = input
      return {
        success: true,
        body: { products: { edges: [{ node: rawProduct }] } }
      }
    }
  )

  assert.equal(products.length, 1)
  assert.deepEqual(
    (
      request as {
        headers?: HeadersInit
        variables: { first: number; query: string | undefined }
      }
    ).headers,
    { 'Shopify-Storefront-Buyer-IP': '203.0.113.8' }
  )
  assert.deepEqual(
    (
      request as {
        variables: { first: number; query: string | undefined }
      }
    ).variables,
    {
      first: 20,
      query: 'handle:utekos-techdown OR handle:comfyrobe'
    }
  )
  assert.doesNotMatch(
    (request as { query: string }).query,
    /quantityAvailable/
  )
})

test('does not send a buyer IP header when it is absent', async () => {
  let request: unknown

  await fetchAssistantProducts({}, async input => {
    request = input
    return { success: true, body: { products: { edges: [] } } }
  })

  assert.equal(
    'headers' in (request as Record<string, unknown>),
    false
  )
  assert.deepEqual(
    (
      request as {
        variables: { first: number; query: string | undefined }
      }
    ).variables,
    { first: 20, query: undefined }
  )
})
