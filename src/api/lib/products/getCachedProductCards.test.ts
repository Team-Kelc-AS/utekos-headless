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
  if (request === 'server-only') {
    return {}
  }

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
        if (catalogError !== undefined) {
          throw catalogError
        }
        return catalogProducts
      }
    }
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { getCachedProductCards } =
  require('./getCachedProductCards.ts') as typeof import('./getCachedProductCards')

test('returns an unavailable result instead of rejecting on Storefront timeout', async () => {
  catalogError = new DOMException(
    'The operation was aborted due to timeout',
    'TimeoutError'
  )
  cacheLifeCalls = []
  const result = await getCachedProductCards({ first: 24 })

  assert.deepEqual(result, {
    status: 'unavailable',
    error: {
      message: 'The operation was aborted due to timeout',
      name: 'TimeoutError'
    }
  })
  assert.deepEqual(cacheLifeCalls, [
    'collections',
    { stale: 0, revalidate: 0, expire: 1 }
  ])
})

test('returns a serializable unavailable result for an uncoercible thrown value', async () => {
  catalogError = Object.create(null)
  cacheLifeCalls = []

  const result = await getCachedProductCards({ first: 24 })

  assert.deepEqual(result, {
    status: 'unavailable',
    error: {
      message: 'Storefront product-card fetch failed',
      name: 'UnknownError'
    }
  })
  assert.deepEqual(cacheLifeCalls, [
    'collections',
    { stale: 0, revalidate: 0, expire: 1 }
  ])
})

test('returns authoritative empty products as a successful result', async () => {
  catalogError = undefined
  catalogProducts = []
  cacheLifeCalls = []

  const result = await getCachedProductCards({ first: 24 })

  assert.deepEqual(result, { status: 'success', products: [] })
  assert.deepEqual(cacheLifeCalls, ['collections'])
})
