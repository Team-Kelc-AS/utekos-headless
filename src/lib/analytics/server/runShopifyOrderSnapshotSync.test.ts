import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { ShopifyCommerceReconciliationOrder } from './shopifyCommerceReconciliationGraphqlSchema'
import type { RunShopifyOrderSnapshotSyncDependencies } from './runShopifyOrderSnapshotSync'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)
moduleWithLoad._load = (request, parent, isMain) =>
  request === 'server-only' ?
    {}
  : originalLoad(request, parent, isMain)

const require = createRequire(import.meta.url)
const { runShopifyOrderSnapshotSync } =
  require('./runShopifyOrderSnapshotSync.ts') as typeof import('./runShopifyOrderSnapshotSync')

function money(amount: string) {
  return {
    shopMoney: { amount, currencyCode: 'NOK' },
    presentmentMoney: { amount, currencyCode: 'NOK' }
  }
}

function order(id: string): ShopifyCommerceReconciliationOrder {
  return {
    id: `gid://shopify/Order/${id}`,
    legacyResourceId: id,
    name: `#${id}`,
    createdAt: '2026-09-01T10:00:00Z',
    processedAt: '2026-09-01T10:01:00Z',
    updatedAt: '2026-09-01T10:05:00Z',
    displayFinancialStatus: 'PAID',
    currencyCode: 'NOK',
    presentmentCurrencyCode: 'NOK',
    taxesIncluded: false,
    email: null,
    phone: null,
    clientIp: null,
    statusPageUrl: null,
    customAttributes: [],
    totalPriceSet: money('100.00'),
    totalTaxSet: money('25.00'),
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
      nodes: []
    },
    refunds: []
  }
}

function dependencies(
  overrides: Partial<RunShopifyOrderSnapshotSyncDependencies> = {}
): RunShopifyOrderSnapshotSyncDependencies {
  return {
    fetchOrdersPage: async () => ({
      endCursor: null,
      hasNextPage: false,
      nodes: []
    }),
    snapshotStore: {
      readCursor: async () => ({ updatedAtShopify: null }),
      upsert: async () => undefined
    },
    now: () => new Date('2026-09-03T12:00:00.000Z'),
    ...overrides
  }
}

test('continues from the persisted order snapshot cursor with overlap', async () => {
  const fetches: Array<{
    after: string | null
    windowStartIso: string
  }> = []
  const upserts: string[] = []
  const summary = await runShopifyOrderSnapshotSync(
    dependencies({
      fetchOrdersPage: async input => {
        fetches.push(input)
        return {
          endCursor: null,
          hasNextPage: false,
          nodes: [order('2001'), order('2002')]
        }
      },
      snapshotStore: {
        readCursor: async () => ({
          updatedAtShopify: '2026-07-08T13:58:42.000Z'
        }),
        upsert: async input => {
          upserts.push(input.order.legacyResourceId)
        }
      }
    })
  )

  assert.deepEqual(fetches, [
    { after: null, windowStartIso: '2026-07-08T13:28:42.000Z' }
  ])
  assert.deepEqual(upserts, ['2001', '2002'])
  assert.deepEqual(summary, {
    ok: true,
    status: 'completed',
    windowStart: '2026-07-08T13:28:42.000Z',
    pages: 1,
    ordersExamined: 2,
    snapshotsUpserted: 2
  })
})

test('never invokes canonical acceptance or provider dispatch', async () => {
  const persisted: string[] = []
  const summary = await runShopifyOrderSnapshotSync(
    dependencies({
      fetchOrdersPage: async () => ({
        endCursor: null,
        hasNextPage: false,
        nodes: [order('2003')]
      }),
      snapshotStore: {
        readCursor: async () => ({ updatedAtShopify: null }),
        upsert: async input => {
          persisted.push(input.order.id)
        }
      }
    })
  )

  assert.equal(summary.snapshotsUpserted, 1)
  assert.deepEqual(persisted, ['gid://shopify/Order/2003'])
})

test('stops without claiming success when persistence fails', async () => {
  const summary = await runShopifyOrderSnapshotSync(
    dependencies({
      fetchOrdersPage: async () => ({
        endCursor: null,
        hasNextPage: false,
        nodes: [order('2004')]
      }),
      snapshotStore: {
        readCursor: async () => ({ updatedAtShopify: null }),
        upsert: async () => {
          throw new Error('database failure')
        }
      }
    })
  )

  assert.equal(summary.ok, false)
  assert.equal(summary.status, 'snapshot_persistence')
  assert.equal(summary.snapshotsUpserted, 0)
})
