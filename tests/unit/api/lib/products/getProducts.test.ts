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
let fail = true
let lifetimes: unknown[] = []
moduleLoader._load = (name, parent, main) => {
  if (name === 'server-only') return {}
  if (name === 'next/cache')
    return {
      cacheTag: () => undefined,
      cacheLife: (profile: unknown) => lifetimes.push(profile)
    }
  if (name === '@/api/graphql/queries/products')
    return {
      getProductsQuery:
        'query Products { products { edges { node { id } } } }'
    }
  if (
    name === '@/api/shopify/storefront/storefrontGateway.server'
  )
    return {
      storefrontGateway: {
        catalogQuery: async () =>
          fail ?
            {
              success: false,
              error: {
                errors: [
                  {
                    message:
                      'The operation was aborted due to timeout'
                  }
                ]
              }
            }
          : { success: true, body: { products: { edges: [] } } }
      }
    }
  if (name === '@/lib/utils/reshapeProducts')
    return { reshapeProducts: (products: unknown[]) => products }
  return originalLoad(name, parent, main)
}
const require = createRequire(import.meta.url)
const { getProducts } =
  require('@/api/lib/products/getProducts') as typeof import('@/api/lib/products/getProducts')
moduleLoader._load = originalLoad

test('expires transient Shopify failures instead of retaining them as catalog snapshots', async () => {
  fail = true
  lifetimes = []
  const result = await getProducts()
  assert.equal(result.success, false)
  assert.deepEqual(lifetimes, [
    { stale: 0, revalidate: 0, expire: 1 }
  ])
})

test('preserves the normal catalog cache policy for successful responses', async () => {
  fail = false
  lifetimes = []
  const result = await getProducts()
  assert.deepEqual(result, {
    success: true,
    status: 200,
    body: []
  })
  assert.deepEqual(lifetimes, ['collections'])
})
