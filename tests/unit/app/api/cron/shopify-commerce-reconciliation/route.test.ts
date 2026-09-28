import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import {
  SHOPIFY_COMMERCE_RECONCILIATION_RUNTIME_BUDGET_MS,
  type ShopifyCommerceReconciliationSummary
} from '@/lib/analytics/server/shopifyCommerceReconciliationTypes'
import type { ShopifyCommerceReconciliationCronDependencies } from '@/app/api/cron/shopify-commerce-reconciliation/route'

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
const { handleShopifyCommerceReconciliationCron, maxDuration } =
  require('./route.ts') as typeof import('@/app/api/cron/shopify-commerce-reconciliation/route')

function request(authorization?: string) {
  return new Request(
    'https://utekos.no/api/cron/shopify-commerce-reconciliation',
    authorization ? { headers: { authorization } } : undefined
  )
}

function completedSummary(
  overrides: Partial<ShopifyCommerceReconciliationSummary> = {}
): ShopifyCommerceReconciliationSummary {
  return {
    ok: true,
    status: 'completed',
    windowStart: '2026-06-30T12:00:00.000Z',
    windowEnd: '2026-07-01T12:00:00.000Z',
    pages: 1,
    ordersExamined: 0,
    purchaseCandidates: 0,
    purchasesAccepted: 0,
    purchasesDuplicate: 0,
    refundCandidates: 0,
    refundsAccepted: 0,
    refundsDuplicate: 0,
    watermarkAdvanced: true,
    failures: [],
    ...overrides
  }
}

test('exports maxDuration 60 matching peer cron budget', () => {
  assert.equal(maxDuration, 60)
  assert.equal(
    maxDuration * 1000 -
      SHOPIFY_COMMERCE_RECONCILIATION_RUNTIME_BUDGET_MS,
    15_000
  )
})

test('rejects shopify commerce reconciliation cron without bearer secret', async () => {
  const dependencies: ShopifyCommerceReconciliationCronDependencies =
    {
      getCronSecret: () => 'correct-secret',
      runReconciliation: async () => {
        throw new Error('runner must not run')
      }
    }

  const response = await handleShopifyCommerceReconciliationCron(
    request('Bearer wrong-secret'),
    dependencies
  )

  assert.equal(response.status, 401)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('runs acceptance mode and returns 200 for completed', async () => {
  const modes: string[] = []
  const dependencies: ShopifyCommerceReconciliationCronDependencies =
    {
      getCronSecret: () => 'correct-secret',
      runReconciliation: async input => {
        modes.push(input.runMode)
        return completedSummary()
      }
    }

  const response = await handleShopifyCommerceReconciliationCron(
    request('Bearer correct-secret'),
    dependencies
  )
  const body =
    (await response.json()) as ShopifyCommerceReconciliationSummary

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(modes, ['accept'])
  assert.equal(body.status, 'completed')
  assert.equal(body.ok, true)
})

test('returns 200 for lease_blocked and non-2xx for failure', async () => {
  const blocked = await handleShopifyCommerceReconciliationCron(
    request('Bearer correct-secret'),
    {
      getCronSecret: () => 'correct-secret',
      runReconciliation: async () =>
        completedSummary({
          status: 'lease_blocked',
          watermarkAdvanced: false
        })
    }
  )
  const failed = await handleShopifyCommerceReconciliationCron(
    request('Bearer correct-secret'),
    {
      getCronSecret: () => 'correct-secret',
      runReconciliation: async () =>
        completedSummary({
          ok: false,
          status: 'partial_page_failure',
          watermarkAdvanced: false
        })
    }
  )

  assert.equal(blocked.status, 200)
  assert.equal(failed.status, 500)
})
