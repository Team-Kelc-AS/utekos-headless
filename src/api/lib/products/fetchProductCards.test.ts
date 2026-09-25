import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { StorefrontCatalogQueryInput } from '@/api/shopify/storefront/StorefrontGatewayContract'
import type { ShopifyProductCardsOperation } from '@types'
import type { StorefrontProductCard } from '@/api/shopify/types/storefrontApi'

const product: StorefrontProductCard = {
  id: 'gid://shopify/Product/1',
  title: 'Utekos TechDown',
  handle: 'utekos-techdown',
  productType: 'Poncho',
  vendor: 'Utekos',
  availableForSale: true,
  featuredImage: null,
  collections: { nodes: [] },
  priceRange: {
    minVariantPrice: { amount: '1999.00', currencyCode: 'NOK' }
  },
  options: [],
  variants: { edges: [] }
}

let catalogInput:
  | StorefrontCatalogQueryInput<ShopifyProductCardsOperation>
  | undefined

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

  if (
    request ===
    '@/api/shopify/storefront/storefrontGateway.server'
  ) {
    return {
      storefrontGateway: {
        catalogQuery: async (
          input: StorefrontCatalogQueryInput<ShopifyProductCardsOperation>
        ) => {
          catalogInput = input
          return {
            success: true,
            body: { productRecommendations: [product] }
          }
        }
      }
    }
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { fetchProductCards } =
  require('./fetchProductCards.ts') as typeof import('./fetchProductCards')

test('fetches bounded Shopify recommendations for the current handle', async () => {
  const products = await fetchProductCards({
    productHandle: 'utekos-mikrofiber',
    timeoutMs: 8_000
  })

  assert.equal(products[0]?.handle, 'utekos-techdown')
  assert.deepEqual(catalogInput?.variables, {
    productHandle: 'utekos-mikrofiber'
  })
  assert.equal(catalogInput?.cache, 'no-store')
  assert.match(catalogInput?.query ?? '', /productRecommendations/)
  assert.doesNotMatch(catalogInput?.query ?? '', /products\(first:/)
})
