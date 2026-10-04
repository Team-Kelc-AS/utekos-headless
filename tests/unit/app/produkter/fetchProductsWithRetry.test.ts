import assert from 'node:assert/strict'
import Module, { createRequire } from 'node:module'
import test from 'node:test'

const moduleLoader = Module as typeof Module & {
  _load: (
    name: string,
    parent: NodeModule | null,
    main: boolean
  ) => unknown
}
const originalLoad = moduleLoader._load.bind(Module)
let freshCalls = 0
let cachedCalls = 0
let failFresh = false
const products = [{ handle: 'utekos-dun' }]
moduleLoader._load = (name, parent, main) => {
  if (name === 'server-only') return {}
  if (name === '@/api/lib/products/getProducts')
    return {
      getProducts: async () => {
        cachedCalls++
        return {
          success: false,
          error: 'The operation was aborted due to timeout'
        }
      },
      fetchProducts: async () => {
        freshCalls++
        if (failFresh) throw new Error('Shopify unavailable')
        return products
      }
    }
  return originalLoad(name, parent, main)
}
const require = createRequire(import.meta.url)
const { fetchProductsWithRetry } =
  require('@/app/produkter/(oversikt)/utils/fetchProductsWithRetry') as typeof import('@/app/produkter/(oversikt)/utils/fetchProductsWithRetry')
moduleLoader._load = originalLoad

test('recovers from a cached timeout by making a fresh catalog request', async () => {
  freshCalls = cachedCalls = 0
  failFresh = false
  assert.deepEqual(await fetchProductsWithRetry(3, 0), products)
  assert.equal(cachedCalls, 1)
  assert.equal(freshCalls, 1)
})

test('stops after the retry limit and preserves the final fetch error', async () => {
  freshCalls = cachedCalls = 0
  failFresh = true
  await assert.rejects(
    fetchProductsWithRetry(3, 0),
    /Shopify unavailable/
  )
  assert.equal(cachedCalls, 1)
  assert.equal(freshCalls, 2)
})
