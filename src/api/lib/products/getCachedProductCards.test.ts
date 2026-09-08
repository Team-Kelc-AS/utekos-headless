import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'

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

  if (
    request ===
    '@/api/lib/products/fetchProductCardsWithRetry'
  ) {
    return {
      fetchProductCardsWithRetry: async () => {
        throw new DOMException(
          'The operation was aborted due to timeout',
          'TimeoutError'
        )
      }
    }
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { getCachedProductCards } =
  require('./getCachedProductCards.ts') as typeof import('./getCachedProductCards')

test('returns an unavailable result instead of rejecting on Storefront timeout', async () => {
  const result = await getCachedProductCards({ first: 24 })

  assert.deepEqual(result, {
    status: 'unavailable',
    error: {
      message: 'The operation was aborted due to timeout',
      name: 'TimeoutError'
    }
  })
})
