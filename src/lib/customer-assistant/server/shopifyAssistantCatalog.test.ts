import assert from 'node:assert/strict'
import test from 'node:test'
import {
  __TEST_ONLY__,
  fetchAssistantProducts,
  normalizeAssistantProduct
} from './shopifyAssistantCatalog'

const rawProduct = {
  id: 'gid://shopify/Product/1',
  handle: 'utekos-techdown',
  title: 'Utekos TechDown',
  availableForSale: true,
  featuredImage: {
    altText: 'TechDown på bryggen',
    url: 'https://cdn.shopify.com/techdown.jpg'
  },
  priceRange: {
    minVariantPrice: { amount: '2490.00', currencyCode: 'NOK' }
  },
  variants: {
    pageInfo: { hasNextPage: false, endCursor: null },
    edges: [
      {
        node: {
          id: 'gid://shopify/ProductVariant/1',
          title: 'Small / Navy',
          availableForSale: true,
          selectedOptions: [
            { name: 'Size', value: 'Small' },
            { name: 'Color', value: 'Navy' }
          ],
          quantityAvailable: 3,
          sku: 'TECHDOWN-S-NAVY'
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
          ],
          quantityAvailable: 0,
          price: { amount: '2490.00', currencyCode: 'NOK' }
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
    availableForSale: true,
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

test('uses the product title when Shopify has no image alt text', () => {
  assert.deepEqual(
    normalizeAssistantProduct({
      ...rawProduct,
      featuredImage: {
        ...rawProduct.featuredImage,
        altText: null
      }
    }).image,
    {
      alt: 'Utekos TechDown',
      url: 'https://cdn.shopify.com/techdown.jpg'
    }
  )
})

test('uses documented product handle lookups with buyer context', async () => {
  let request: unknown
  const fetchProducts =
    __TEST_ONLY__.createFetchAssistantProducts(async input => {
      request = input
      return {
        success: true,
        body: {
          product0: rawProduct,
          product1: {
            ...rawProduct,
            id: 'gid://shopify/Product/2',
            handle: 'comfyrobe',
            title: 'Comfyrobe'
          }
        }
      }
    })

  const products = await fetchProducts({
    buyerIp: '203.0.113.8',
    handles: ['utekos-techdown', 'comfyrobe', 'utekos-techdown']
  })

  assert.deepEqual(
    products.map(product => product.handle),
    ['utekos-techdown', 'comfyrobe']
  )
  assert.deepEqual(
    (
      request as {
        headers?: HeadersInit
        variables: Record<string, string | number>
      }
    ).headers,
    { 'Shopify-Storefront-Buyer-IP': '203.0.113.8' }
  )
  assert.deepEqual(
    (request as { variables: Record<string, string | number> })
      .variables,
    { handle0: 'utekos-techdown', handle1: 'comfyrobe' }
  )
  assert.match(
    (request as { query: string }).query,
    /product0: product\(handle: \$handle0\)/
  )
  assert.match(
    (request as { query: string }).query,
    /product1: product\(handle: \$handle1\)/
  )
  assert.doesNotMatch(
    (request as { query: string }).query,
    /quantityAvailable/
  )
  assert.match(
    (request as { query: string }).query,
    /\bavailableForSale\b/
  )
  assert.match(
    (request as { query: string }).query,
    /variants\(first:\s*250\)/
  )
  assert.match(
    (request as { query: string }).query,
    /pageInfo\s*{\s*hasNextPage/
  )
})

test('lists up to twenty products without a buyer IP header when handles are absent', async () => {
  let request: unknown
  const fetchProducts =
    __TEST_ONLY__.createFetchAssistantProducts(async input => {
      request = input
      return { success: true, body: { products: { edges: [] } } }
    })

  await fetchProducts({})

  assert.equal(
    'headers' in (request as Record<string, unknown>),
    false
  )
  assert.deepEqual(
    (request as { variables: Record<string, string | number> })
      .variables,
    { first: 20 }
  )
  assert.match(
    (request as { query: string }).query,
    /products\(first: \$first\)/
  )
})

test('normalizes Storefront transport failures to the safe catalog error', async () => {
  const fetchProducts =
    __TEST_ONLY__.createFetchAssistantProducts(async () => {
      throw new Error('Missing Shopify storefront access token.')
    })

  await assert.rejects(fetchProducts({}), {
    message: 'shopify_assistant_catalog_unavailable'
  })
})

test('fails closed when Shopify reports more variants than the bounded query returned', async () => {
  const fetchProducts =
    __TEST_ONLY__.createFetchAssistantProducts(async () => ({
      success: true,
      body: {
        product0: {
          ...rawProduct,
          variants: {
            ...rawProduct.variants,
            pageInfo: {
              hasNextPage: true,
              endCursor: 'variant-cursor'
            }
          }
        }
      }
    }))

  await assert.rejects(
    fetchProducts({ handles: ['utekos-techdown'] }),
    { message: 'shopify_assistant_catalog_unavailable' }
  )
})

test('aborts a stalled Shopify catalog read at the adapter deadline', async () => {
  let signal: AbortSignal | undefined
  const fetchProducts =
    __TEST_ONLY__.createFetchAssistantProducts(
      async input => {
        signal = input.signal

        return await new Promise((_, reject) => {
          if (!input.signal) {
            reject(new Error('missing abort signal'))
            return
          }

          input.signal.addEventListener(
            'abort',
            () => reject(input.signal?.reason),
            { once: true }
          )
        })
      },
      { deadlineMs: 5 }
    )

  await assert.rejects(fetchProducts({}), {
    message: 'shopify_assistant_catalog_unavailable'
  })
  assert.equal(signal?.aborted, true)
})

test('rejects invalid handles before they reach Shopify', async () => {
  let called = false
  const fetchProducts =
    __TEST_ONLY__.createFetchAssistantProducts(async () => {
      called = true
      return { success: true, body: { products: { edges: [] } } }
    })

  await assert.rejects(
    fetchProducts({ handles: ['NOT-VALID'] }),
    { message: 'shopify_assistant_catalog_unavailable' }
  )
  assert.equal(called, false)
})

test('exports a one-argument catalog API', () => {
  assert.equal(fetchAssistantProducts.length, 1)
})
