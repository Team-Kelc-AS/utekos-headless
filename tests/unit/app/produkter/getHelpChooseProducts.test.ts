import assert from 'node:assert/strict'
import Module, { createRequire } from 'node:module'
import test from 'node:test'

import { ShopifyStorefrontHttpError } from '@/api/shopify/request/ShopifyStorefrontHttpError'

const moduleLoader = Module as typeof Module & {
  _load: (
    name: string,
    parent: NodeModule | null,
    main: boolean
  ) => unknown
}
const originalLoad = moduleLoader._load.bind(Module)
const cacheLifeCalls: unknown[] = []
const transientError = new ShopifyStorefrontHttpError(
  503,
  'request-help-choose'
)

moduleLoader._load = (name, parent, main) => {
  if (name === 'server-only') return {}
  if (name === 'next/cache') {
    return {
      cacheLife: (value: unknown) => cacheLifeCalls.push(value),
      cacheTag: () => undefined
    }
  }
  if (name === 'next/navigation') {
    return { unstable_rethrow: () => undefined }
  }
  if (name === '@/api/constants') {
    return { TAGS: { products: 'products' } }
  }
  if (
    name ===
    '@/api/lib/products/fetchShopifyCatalogWithRetry'
  ) {
    return {
      fetchShopifyCatalogWithRetry: async () => {
        throw transientError
      }
    }
  }
  if (
    name ===
    '@/api/lib/products/isRetryableShopifyCatalogError'
  ) {
    return { isRetryableShopifyCatalogError: () => true }
  }
  if (
    name ===
    '@/api/shopify/storefront/storefrontGateway.server'
  ) {
    return { storefrontGateway: {} }
  }
  return originalLoad(name, parent, main)
}

const require = createRequire(import.meta.url)
const { getHelpChooseProducts } =
  require('@/app/produkter/(oversikt)/utils/getHelpChooseProducts') as typeof import('@/app/produkter/(oversikt)/utils/getHelpChooseProducts')
moduleLoader._load = originalLoad

test('fails open with a one-second recovery cache after exhausted transient failures', async () => {
  cacheLifeCalls.length = 0

  assert.deepEqual(await getHelpChooseProducts(), [])
  assert.deepEqual(cacheLifeCalls, [
    { stale: 0, revalidate: 0, expire: 1 }
  ])
})
