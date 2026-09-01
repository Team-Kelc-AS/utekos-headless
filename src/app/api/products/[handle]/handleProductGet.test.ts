import assert from 'node:assert/strict'
import test from 'node:test'
import type { ShopifyProduct } from 'types/product'
import { handleProductGet } from './handleProductGet'

const request = new Request(
  'https://utekos.no/api/products/utekos-techdown'
)

function context(handle: string) {
  return { params: Promise.resolve({ handle }) }
}

test('returns a cached public product response', async () => {
  const product = {
    id: 'gid://shopify/Product/1',
    handle: 'utekos-techdown',
    title: 'Utekos TechDown'
  } as ShopifyProduct

  const response = await handleProductGet(
    request,
    context(product.handle),
    {
      getProduct: async () => product,
      reportError: () => undefined
    }
  )

  assert.equal(response.status, 200)
  assert.match(
    response.headers.get('cache-control') ?? '',
    /s-maxage=300/
  )
  assert.deepEqual(await response.json(), product)
})

test('rejects an invalid handle before querying Shopify', async () => {
  let calls = 0
  const response = await handleProductGet(
    request,
    context('../private'),
    {
      getProduct: async () => {
        calls += 1
        return null
      },
      reportError: () => undefined
    }
  )

  assert.equal(response.status, 400)
  assert.equal(calls, 0)
})

test('returns 404 when Shopify has no matching product', async () => {
  const response = await handleProductGet(
    request,
    context('missing-product'),
    {
      getProduct: async () => null,
      reportError: () => undefined
    }
  )

  assert.equal(response.status, 404)
})

test('reports a bounded operational error and returns 502', async () => {
  const reports: string[] = []
  const response = await handleProductGet(
    request,
    context('utekos-techdown'),
    {
      getProduct: async () => {
        throw new Error('provider failed')
      },
      reportError: input => reports.push(input.event)
    }
  )

  assert.equal(response.status, 502)
  assert.deepEqual(reports, ['shopify.quick_view.fetch_failed'])
  assert.deepEqual(await response.json(), {
    error: 'product_fetch_failed'
  })
})
