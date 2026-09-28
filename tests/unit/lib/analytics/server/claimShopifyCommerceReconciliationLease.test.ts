import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import {
  SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME,
  SHOPIFY_COMMERCE_RECONCILIATION_LEASE_SECONDS
} from '@/lib/analytics/server/shopifyCommerceReconciliationTypes'

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
const {
  claimShopifyCommerceReconciliationLease,
  updateShopifyCommerceReconciliationLeaseWindow
} =
  require('./claimShopifyCommerceReconciliationLease.ts') as typeof import('@/lib/analytics/server/claimShopifyCommerceReconciliationLease')

test('claimShopifyCommerceReconciliationLease returns unavailable without postgres', async () => {
  const lease = await claimShopifyCommerceReconciliationLease(
    {
      activeRunStartedAt: '2026-07-01T12:00:00.000Z',
      runMode: 'accept'
    },
    { getSql: () => null, createLeaseOwner: () => 'owner-1' }
  )

  assert.equal(lease.status, 'unavailable')
  if (lease.status === 'unavailable') {
    assert.equal(lease.reason, 'postgres_unavailable')
    assert.equal(
      lease.jobName,
      SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME
    )
    assert.equal(lease.leaseOwner, 'owner-1')
  }
})

test('claimShopifyCommerceReconciliationLease merges metadata and preserves watermark', async () => {
  const mergedPatches: unknown[] = []
  let call = 0

  const sql = Object.assign(
    async <T>() => {
      call += 1
      if (call === 1) {
        return [
          {
            jobName: SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME,
            leaseOwner: 'owner-2',
            acquiredAt: new Date('2026-07-01T12:00:00.000Z'),
            expiresAt: new Date(
              Date.parse('2026-07-01T12:00:00.000Z') +
                SHOPIFY_COMMERCE_RECONCILIATION_LEASE_SECONDS *
                  1000
            ),
            metadata: {
              lastSuccessfulWindowEnd:
                '2026-07-01T11:00:00.000Z',
              lastSuccessfulRunCompletedAt:
                '2026-07-01T11:00:05.000Z',
              activeRunStartedAt: '2026-07-01T12:00:00.000Z',
              runMode: 'accept'
            }
          }
        ] as unknown as T
      }
      return [] as unknown as T
    },
    {
      json: (value: unknown) => {
        mergedPatches.push(value)
        return value
      }
    }
  )

  const lease = await claimShopifyCommerceReconciliationLease(
    {
      activeRunStartedAt: '2026-07-01T12:00:00.000Z',
      runMode: 'accept'
    },
    { getSql: () => sql, createLeaseOwner: () => 'owner-2' }
  )

  assert.equal(lease.status, 'acquired')
  if (lease.status === 'acquired') {
    assert.equal(
      lease.metadata.lastSuccessfulWindowEnd,
      '2026-07-01T11:00:00.000Z'
    )
  }
  assert.deepEqual(mergedPatches[0], {
    activeRunStartedAt: '2026-07-01T12:00:00.000Z',
    runMode: 'accept'
  })
})

test('claimShopifyCommerceReconciliationLease returns blocked when active lease exists', async () => {
  let call = 0
  const sql = Object.assign(
    async <T>() => {
      call += 1
      if (call === 1) return [] as unknown as T
      return [
        {
          jobName: SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME,
          leaseOwner: 'other-owner',
          acquiredAt: new Date('2026-07-01T12:00:00.000Z'),
          expiresAt: new Date('2026-07-01T12:15:00.000Z'),
          metadata: {}
        }
      ] as unknown as T
    },
    { json: (value: unknown) => value }
  )

  const lease = await claimShopifyCommerceReconciliationLease(
    {
      activeRunStartedAt: '2026-07-01T12:00:00.000Z',
      runMode: 'accept'
    },
    { getSql: () => sql, createLeaseOwner: () => 'owner-3' }
  )

  assert.equal(lease.status, 'blocked')
  if (lease.status === 'blocked') {
    assert.equal(lease.leaseOwner, 'other-owner')
  }
})

test('claimShopifyCommerceReconciliationLease redacts postgres failures', async () => {
  const sql = Object.assign(
    async <T>(): Promise<T> => {
      throw new Error('sensitive_database_error')
    },
    { json: (value: unknown) => value }
  )

  const lease = await claimShopifyCommerceReconciliationLease(
    {
      activeRunStartedAt: '2026-07-01T12:00:00.000Z',
      runMode: 'accept'
    },
    {
      getSql: () => sql,
      createLeaseOwner: () => 'owner-redacted'
    }
  )

  assert.equal(lease.status, 'unavailable')
  if (lease.status === 'unavailable') {
    assert.equal(lease.reason, 'postgres_unavailable')
  }
  assert.equal(
    JSON.stringify(lease).includes('sensitive_database_error'),
    false
  )
})

test('updateShopifyCommerceReconciliationLeaseWindow merges the computed window for the lease owner', async () => {
  const patches: unknown[] = []
  const sql = Object.assign(
    async <T>() =>
      [
        { jobName: SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME }
      ] as unknown as T,
    {
      json: (value: unknown) => {
        patches.push(value)
        return value
      }
    }
  )

  const updated =
    await updateShopifyCommerceReconciliationLeaseWindow(
      {
        activeWindowEnd: '2026-07-01T12:00:00.000Z',
        activeWindowStart: '2026-07-01T11:20:00.000Z',
        lease: {
          status: 'acquired',
          jobName: SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME,
          leaseOwner: 'owner-4',
          acquiredAt: '2026-07-01T12:00:00.000Z',
          expiresAt: '2026-07-01T12:15:00.000Z',
          metadata: {
            lastSuccessfulWindowEnd: '2026-07-01T11:50:00.000Z'
          }
        }
      },
      { getSql: () => sql }
    )

  assert.equal(updated, true)
  assert.deepEqual(patches, [
    {
      activeWindowEnd: '2026-07-01T12:00:00.000Z',
      activeWindowStart: '2026-07-01T11:20:00.000Z'
    }
  ])
})
