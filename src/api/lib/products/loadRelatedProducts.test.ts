import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { RuntimeCache } from '@vercel/functions'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

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

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { loadRelatedProducts } =
  require('./loadRelatedProducts.ts') as typeof import('./loadRelatedProducts')

class FakeRuntimeCache implements RuntimeCache {
  values = new Map<string, unknown>()

  async get(key: string) {
    return this.values.get(key) ?? null
  }

  async set(key: string, value: unknown) {
    this.values.set(key, value)
  }

  async delete(key: string) {
    this.values.delete(key)
  }

  async expireTag() {}
}

function createCard(handle: string): ProductCardModel {
  return {
    id: `gid://shopify/Product/${handle}`,
    title: handle,
    handle,
    productType: 'Comfyrobe',
    vendor: 'Utekos',
    featuredImage: null,
    collections: { nodes: [] },
    priceRange: {
      minVariantPrice: { amount: '1790.00', currencyCode: 'NOK' }
    },
    options: [],
    variants: { edges: [] }
  }
}

test('keeps the last valid related list when Shopify times out', async () => {
  const snapshot = [createCard('utekos-techdown')]
  const related = await loadRelatedProducts(
    'utekos-mikrofiber',
    12,
    {
      runtimeCache: new FakeRuntimeCache(),
      fetchProductCardsWithRetry: async () => {
        throw new DOMException(
          'The operation was aborted due to timeout',
          'TimeoutError'
        )
      },
      getSnapshot: async () => snapshot,
      setSnapshot: async () => {
        throw new Error(
          'must not overwrite last-good on Shopify failure'
        )
      }
    }
  )

  assert.deepEqual(
    related.map(product => product.handle),
    ['utekos-techdown']
  )
})

test('writes a related-products snapshot after a successful Shopify fetch', async () => {
  const writes: ProductCardModel[][] = []
  const related = await loadRelatedProducts('utekos-dun', 12, {
    runtimeCache: new FakeRuntimeCache(),
    fetchProductCardsWithRetry: async () => [
      createCard('utekos-dun'),
      createCard('utekos-mikrofiber'),
      createCard('utekos-techdown')
    ],
    getSnapshot: async () => null,
    setSnapshot: async (_handle, products) => {
      writes.push(products)
    }
  })

  assert.deepEqual(
    related.map(product => product.handle),
    ['utekos-mikrofiber', 'utekos-techdown']
  )
  assert.deepEqual(
    writes[0]?.map(product => product.handle),
    ['utekos-mikrofiber', 'utekos-techdown']
  )
})

test('returns an empty list when Shopify fails and no snapshot exists', async () => {
  const related = await loadRelatedProducts(
    'utekos-techdown',
    12,
    {
      runtimeCache: new FakeRuntimeCache(),
      fetchProductCardsWithRetry: async () => {
        throw new DOMException(
          'The operation was aborted due to timeout',
          'TimeoutError'
        )
      },
      getSnapshot: async () => null
    }
  )

  assert.deepEqual(related, [])
})

test('removes an obsolete snapshot after an authoritative empty result', async () => {
  let deletedHandle: string | undefined

  const related = await loadRelatedProducts(
    'utekos-techdown',
    12,
    {
      runtimeCache: new FakeRuntimeCache(),
      fetchProductCardsWithRetry: async () => [
        createCard('utekos-techdown')
      ],
      deleteSnapshot: async handle => {
        deletedHandle = handle
      },
      getSnapshot: async () => [createCard('utekos-mikrofiber')]
    }
  )

  assert.deepEqual(related, [])
  assert.equal(deletedHandle, 'utekos-techdown')
})
