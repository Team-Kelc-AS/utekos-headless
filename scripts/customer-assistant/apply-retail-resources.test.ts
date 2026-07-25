import assert from 'node:assert/strict'
import test from 'node:test'
import {
  planSimilarItemsResources,
  retailResourceNames,
  runRetailResourceApply,
  type RetailApplyClients
} from './apply-retail-resources'
import { buildRetailCatalog } from './retail-catalog'

const rawProduct = {
  availableForSale: true,
  description: 'Varmt plagg for uteliv.',
  featuredImage: {
    altText: 'Utekos Original',
    url: 'https://cdn.shopify.com/product.jpg'
  },
  handle: 'utekos-original',
  id: 'gid://shopify/Product/123',
  onlineStoreUrl: null,
  priceRange: {
    minVariantPrice: { amount: '2499.00', currencyCode: 'NOK' }
  },
  productType: 'Uteklær',
  tags: ['Vinter'],
  title: 'Utekos Original',
  variants: {
    nodes: [
      {
        availableForSale: true,
        id: 'gid://shopify/ProductVariant/456',
        price: { amount: '2499.00', currencyCode: 'NOK' },
        selectedOptions: [
          { name: 'Størrelse', value: 'M' },
          { name: 'Farge', value: 'Havdyp' }
        ],
        sku: 'UTEKOS-M-HAVDYP',
        title: 'M / Havdyp'
      }
    ],
    pageInfo: { hasNextPage: false }
  },
  vendor: 'Utekos'
}

test('maps primary products and real variants to stable Retail ids', () => {
  const catalog = buildRetailCatalog([rawProduct])

  assert.equal(catalog.primaryProductCount, 1)
  assert.equal(catalog.variantCount, 1)
  assert.deepEqual(
    catalog.products.map(product => product.id),
    ['shopify-product-123', 'shopify-variant-456']
  )
  assert.equal(catalog.products[0]?.type, 'PRIMARY')
  assert.equal(catalog.products[1]?.type, 'VARIANT')
  assert.equal(
    catalog.products[1]?.primaryProductId,
    'shopify-product-123'
  )
  assert.deepEqual(catalog.products[1]?.sizes, ['M'])
})

test('fails closed when Shopify reports another variant page', () => {
  assert.throws(
    () =>
      buildRetailCatalog([
        {
          ...rawProduct,
          variants: {
            ...rawProduct.variants,
            pageInfo: { hasNextPage: true }
          }
        }
      ]),
    /retail_catalog_variant_page_incomplete/
  )
})

test('blocks Similar Items below the documented minimum', () => {
  assert.deepEqual(planSimilarItemsResources(14, [], []), {
    action: 'blocked_minimum_variants',
    minimum: 100,
    variantCount: 14
  })
})

test('plans the model and serving config in safe order', () => {
  assert.deepEqual(planSimilarItemsResources(100, [], []), {
    action: 'create_model'
  })

  const model = {
    displayName: 'Utekos Similar Items v1',
    name: retailResourceNames.model,
    servingState: 'NOT_ACTIVE',
    type: 'similar-items'
  }
  assert.deepEqual(planSimilarItemsResources(100, [model], []), {
    action: 'wait_for_active_model'
  })

  const activeModel = { ...model, servingState: 'ACTIVE' }
  assert.deepEqual(
    planSimilarItemsResources(100, [activeModel], []),
    { action: 'create_serving_config' }
  )

  assert.deepEqual(
    planSimilarItemsResources(
      100,
      [activeModel],
      [
        {
          displayName: 'Utekos Similar Items v1',
          modelId: 'utekos-similar-items-v1',
          name: retailResourceNames.servingConfig,
          solutionTypes: ['SOLUTION_TYPE_RECOMMENDATION']
        }
      ]
    ),
    { action: 'ready' }
  )
})

test('refuses a second Similar Items model', () => {
  assert.throws(
    () =>
      planSimilarItemsResources(
        100,
        [
          {
            name: `${retailResourceNames.catalog}/models/other-similar-items`,
            type: 'similar-items'
          }
        ],
        []
      ),
    /gcp_retail_similar_items_model_drift/
  )
})

function fakeClients(): RetailApplyClients {
  return {
    async createModel() {
      throw new Error('unexpected_create_model')
    },
    async createServingConfig() {
      throw new Error('unexpected_create_serving_config')
    },
    async importProducts() {
      return {
        name: 'operations/import-1',
        async promise() {
          return [
            { errorSamples: [] },
            { failureCount: 0, successCount: 2, totalCount: 2 }
          ]
        }
      }
    },
    async listModels() {
      return []
    },
    async listProducts() {
      return ['shopify-product-123', 'shopify-variant-456']
    },
    async listServingConfigs() {
      return []
    }
  }
}

test('requires the catalog approval before auth or data access', async () => {
  let touched = false

  await assert.rejects(
    runRetailResourceApply(
      [],
      {},
      {
        async buildCatalog() {
          touched = true
          return buildRetailCatalog([rawProduct])
        },
        createClients() {
          touched = true
          return fakeClients()
        },
        log() {}
      }
    ),
    /gcp_retail_catalog_requires_explicit_approval/
  )
  assert.equal(touched, false)
})

test('imports the catalog but never creates a model below 100 variants', async () => {
  const logs: string[] = []
  const result = await runRetailResourceApply(
    ['--apply-catalog'],
    {
      ASSISTANT_GCP_RETAIL_CATALOG_APPROVAL:
        'approved-utekos-retail-v1',
      GCP_RETAIL_ACCESS_TOKEN: 'test-token'
    },
    {
      async buildCatalog() {
        return buildRetailCatalog([rawProduct])
      },
      createClients: fakeClients,
      log: line => logs.push(line)
    }
  )

  assert.equal(result.model.action, 'blocked_minimum_variants')
  assert.equal(logs.length, 2)
  assert.match(logs[0] ?? '', /"successCount":"2"/)
  assert.match(logs[1] ?? '', /"minimum":100/)
})
