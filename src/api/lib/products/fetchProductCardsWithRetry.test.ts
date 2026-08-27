import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import { ShopifyCatalogGraphQLError } from './ShopifyCatalogGraphQLError'
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
const { fetchProductCardsWithRetry } =
  require('./fetchProductCardsWithRetry.ts') as typeof import('./fetchProductCardsWithRetry')

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

test('retries a timeout once with jitter inside the shared budget', async () => {
  let now = 0
  let attempts = 0
  const delays: number[] = []
  const cards = [createCard('utekos-techdown')]

  const result = await fetchProductCardsWithRetry({
    first: 24,
    budgetMs: 2_000,
    now: () => now,
    random: () => 0,
    sleep: async ms => {
      delays.push(ms)
      now += ms
    },
    fetchProductCards: async () => {
      attempts += 1
      now += 100
      if (attempts === 1) {
        throw new DOMException(
          'The operation was aborted due to timeout',
          'TimeoutError'
        )
      }
      return cards
    }
  })

  assert.equal(attempts, 2)
  assert.deepEqual(delays, [50])
  assert.equal(result[0]?.handle, 'utekos-techdown')
})

test('does not retry GraphQL validation errors', async () => {
  let attempts = 0

  await assert.rejects(
    fetchProductCardsWithRetry({
      first: 24,
      budgetMs: 2_000,
      now: () => 0,
      sleep: async () => {
        throw new Error('sleep should not run')
      },
      fetchProductCards: async () => {
        attempts += 1
        throw new ShopifyCatalogGraphQLError(
          'Field is not defined on Product',
          'GRAPHQL_VALIDATION_FAILED'
        )
      }
    }),
    ShopifyCatalogGraphQLError
  )

  assert.equal(attempts, 1)
})

test(
  'enforces the total budget when an attempt ignores its abort signal',
  { timeout: 500 },
  async () => {
    const startedAt = performance.now()

    await assert.rejects(
      fetchProductCardsWithRetry({
        first: 24,
        budgetMs: 40,
        fetchProductCards: async () => new Promise(() => {})
      }),
      (error: unknown) =>
        error instanceof DOMException && error.name === 'TimeoutError'
    )

    assert.ok(
      performance.now() - startedAt < 300,
      'the shared catalog budget must not depend on adapter signal handling'
    )
  }
)
