import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import { SHOPIFY_COMMERCE_RECONCILIATION_QUERY } from './shopifyCommerceReconciliationGraphqlSchema'
import { SHOPIFY_COMMERCE_RECONCILIATION_PAGE_SIZE } from './shopifyCommerceReconciliationTypes'

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
const { fetchShopifyCommerceReconciliationOrdersPage } =
  require('./fetchShopifyCommerceReconciliationOrders.ts') as typeof import('./fetchShopifyCommerceReconciliationOrders')

function money(amount: string) {
  return {
    shopMoney: { amount, currencyCode: 'NOK' },
    presentmentMoney: { amount, currencyCode: 'NOK' }
  }
}

function validPage() {
  return {
    orders: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          id: 'gid://shopify/Order/1',
          legacyResourceId: '1',
          name: '#1001',
          createdAt: '2026-07-01T10:00:00Z',
          processedAt: '2026-07-01T10:00:00Z',
          updatedAt: '2026-07-01T10:05:00Z',
          displayFinancialStatus: 'PAID',
          currencyCode: 'NOK',
          presentmentCurrencyCode: 'NOK',
          taxesIncluded: false,
          email: null,
          phone: null,
          clientIp: null,
          statusPageUrl: null,
          customAttributes: [],
          totalPriceSet: money('10.00'),
          totalTaxSet: money('0.00'),
          totalShippingPriceSet: money('0.00'),
          discountCodes: [],
          discountApplications: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: []
          },
          shippingAddress: null,
          billingAddress: null,
          customer: null,
          customerJourneySummary: null,
          lineItems: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [
              {
                id: 'gid://shopify/LineItem/1',
                name: 'Item',
                title: 'Item',
                quantity: 1,
                sku: null,
                variant: {
                  id: 'gid://shopify/ProductVariant/1',
                  legacyResourceId: '1'
                },
                originalUnitPriceSet: money('10.00'),
                taxLines: [],
                discountAllocations: []
              }
            ]
          },
          refunds: []
        }
      ]
    }
  }
}

test('fetchShopifyCommerceReconciliationOrdersPage uses updated_at query and page size 50', async () => {
  const calls: Array<{
    query: string
    variables?: Record<string, unknown>
  }> = []

  const page =
    await fetchShopifyCommerceReconciliationOrdersPage(
      {
        after: null,
        windowStartIso: '2026-07-01T00:00:00.000Z'
      },
      async <TData>(
        query: string,
        variables?: Record<string, unknown>
      ) => {
        calls.push({
          query,
          ...(variables === undefined ? {} : { variables })
        })
        return validPage() as unknown as TData
      }
    )

  assert.equal(calls.length, 1)
  assert.equal(
    calls[0]?.query,
    SHOPIFY_COMMERCE_RECONCILIATION_QUERY
  )
  assert.deepEqual(calls[0]?.variables, {
    after: null,
    first: SHOPIFY_COMMERCE_RECONCILIATION_PAGE_SIZE,
    query: 'updated_at:>=2026-07-01T00:00:00.000Z'
  })
  assert.equal(page.nodes.length, 1)
  assert.equal(page.hasNextPage, false)
})

test('Shopify reconciliation query keeps the frozen nested limits and local paid guard', () => {
  assert.match(
    SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
    /lineItems\(first: 250\)/
  )
  assert.match(
    SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
    /refunds\(first: 250\)/
  )
  assert.match(
    SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
    /refundLineItems\(first: 250\)/
  )
  assert.match(
    SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
    /transactions\(first: 50\)/
  )
  assert.match(
    SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
    /shippingAddress \{\s+city\s+phone/
  )
  assert.match(
    SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
    /billingAddress \{\s+city\s+phone/
  )
  assert.doesNotMatch(
    SHOPIFY_COMMERCE_RECONCILIATION_QUERY,
    /financial_status/
  )
})

test('fetchShopifyCommerceReconciliationOrdersPage maps auth failures', async () => {
  await assert.rejects(
    () =>
      fetchShopifyCommerceReconciliationOrdersPage(
        {
          after: null,
          windowStartIso: '2026-07-01T00:00:00.000Z'
        },
        async () => {
          throw new Error(
            'Shopify Admin API credentials are not configured'
          )
        }
      ),
    (error: unknown) =>
      error instanceof Error &&
      (error as { code?: string }).code === 'shopify_auth'
  )
})

test('fetchShopifyCommerceReconciliationOrdersPage maps throttling without exposing provider errors', async () => {
  await assert.rejects(
    () =>
      fetchShopifyCommerceReconciliationOrdersPage(
        {
          after: null,
          windowStartIso: '2026-07-01T00:00:00.000Z'
        },
        async () => {
          throw new Error('THROTTLED provider detail')
        }
      ),
    (error: unknown) =>
      error instanceof Error &&
      error.message === 'shopify_rate_limited' &&
      (error as { code?: string }).code ===
        'shopify_rate_limited'
  )
})

test('fetchShopifyCommerceReconciliationOrdersPage rejects invalid response shapes', async () => {
  await assert.rejects(
    () =>
      fetchShopifyCommerceReconciliationOrdersPage(
        {
          after: null,
          windowStartIso: '2026-07-01T00:00:00.000Z'
        },
        async <TData>() => ({ orders: null }) as unknown as TData
      ),
    (error: unknown) =>
      error instanceof Error &&
      error.message === 'shopify_graphql' &&
      (error as { code?: string }).code === 'shopify_graphql'
  )
})

test('fetchShopifyCommerceReconciliationOrdersPage distinguishes scope denial from authentication', async () => {
  await assert.rejects(
    () =>
      fetchShopifyCommerceReconciliationOrdersPage(
        {
          after: null,
          windowStartIso: '2026-07-01T00:00:00.000Z'
        },
        async () => {
          throw new Error(
            'Shopify Admin API error (403): ACCESS_DENIED'
          )
        }
      ),
    (error: unknown) =>
      error instanceof Error &&
      (error as { code?: string }).code === 'shopify_scope'
  )
})
