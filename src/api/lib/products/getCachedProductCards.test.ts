import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

let catalogError: unknown
let catalogProducts: ProductCardModel[] = []
let cacheLifeCalls: unknown[] = []

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

  if (request === 'next/cache') {
    return {
      cacheLife: (profile: unknown) => {
        cacheLifeCalls.push(profile)
      },
      cacheTag: () => undefined
    }
  }

  if (request === '@/api/constants') {
    return { TAGS: { products: 'products' } }
  }

  if (request.includes('fetchProductCardsWithRetry')) {
    return {
      fetchProductCardsWithRetry: async () => {
        if (catalogError !== undefined) throw catalogError
        return catalogProducts
      }
    }
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { getCachedProductCards } =
  require('./getCachedProductCards.ts') as typeof import('./getCachedProductCards')

test('serializes a Storefront timeout inside the remote cache boundary', async () => {
  catalogError = new DOMException(
    'The operation was aborted due to timeout',
    'TimeoutError'
  )
  cacheLifeCalls = []

  const result = await getCachedProductCards({ first: 24 })

  assert.deepEqual(result, {
    status: 'unavailable',
    error: {
      name: 'TimeoutError',
      message: 'The operation was aborted due to timeout'
    }
  })
  assert.deepEqual(cacheLifeCalls, [
    { stale: 0, revalidate: 0, expire: 1 }
  ])
})

test('uses the catalog cache profile only after a successful fetch', async () => {
  catalogError = undefined
  catalogProducts = []
  cacheLifeCalls = []

  const result = await getCachedProductCards({ first: 24 })

  assert.deepEqual(result, { status: 'success', products: [] })
  assert.deepEqual(cacheLifeCalls, ['collections'])
})
