import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

let catalogResult: ProductCardModel[] | Error = new DOMException(
  'The operation was aborted due to timeout',
  'TimeoutError'
)

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
      cacheLife: () => undefined,
      cacheTag: () => undefined
    }
  }

  if (request === '@/api/constants') {
    return { TAGS: { products: 'products' } }
  }

  if (request.includes('fetchProductCardsWithRetry')) {
    return {
      fetchProductCardsWithRetry: async () => {
        if (catalogResult instanceof Error) {
          throw catalogResult
        }
        return catalogResult
      }
    }
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { getCachedProductCards } =
  require('./getCachedProductCards.ts') as typeof import('./getCachedProductCards')

test('returns an unavailable result instead of rejecting on Storefront timeout', async () => {
  catalogResult = new DOMException(
    'The operation was aborted due to timeout',
    'TimeoutError'
  )
  const result = await getCachedProductCards({ first: 24 })

  assert.deepEqual(result, {
    status: 'unavailable',
    error: {
      message: 'The operation was aborted due to timeout',
      name: 'TimeoutError'
    }
  })
})

test('returns authoritative empty products as a successful result', async () => {
  catalogResult = []

  const result = await getCachedProductCards({ first: 24 })

  assert.deepEqual(result, { status: 'success', products: [] })
})
