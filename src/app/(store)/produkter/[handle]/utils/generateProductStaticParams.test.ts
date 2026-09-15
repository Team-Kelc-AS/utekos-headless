import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { ShopifyProduct } from 'types/product'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') return {}
  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { generateProductStaticParams } =
  require('./generateProductStaticParams.ts') as typeof import('./generateProductStaticParams')

function catalogProduct(handle: string): ShopifyProduct {
  return { handle } as ShopifyProduct
}

test('returns only locally presented products that exist in Shopify', async () => {
  const params = await generateProductStaticParams({
    fetchProducts: async () => ({
      success: true,
      status: 200,
      body: [
        catalogProduct('utekos-techdown'),
        catalogProduct('not-a-presented-product')
      ]
    })
  })

  assert.deepEqual(params, [{ handle: 'utekos-techdown' }])
})

test('uses local product presentations when Shopify returns a failure', async () => {
  const params = await generateProductStaticParams({
    fetchProducts: async () => ({
      success: false,
      status: 500,
      error: 'Shopify unavailable'
    })
  })

  assert.ok(params.length > 0)
  assert.ok(
    params.some(({ handle }) => handle === 'utekos-techdown')
  )
})

test('uses local product presentations when Shopify throws', async () => {
  const params = await generateProductStaticParams({
    fetchProducts: async () => {
      throw new DOMException(
        'Shopify request timed out',
        'TimeoutError'
      )
    }
  })

  assert.ok(params.length > 0)
  assert.ok(
    params.some(({ handle }) => handle === 'utekos-mikrofiber')
  )
})

test('uses local product presentations for an authoritative empty catalog', async () => {
  const params = await generateProductStaticParams({
    fetchProducts: async () => ({
      success: true,
      status: 200,
      body: []
    })
  })

  assert.ok(params.length > 0)
})
