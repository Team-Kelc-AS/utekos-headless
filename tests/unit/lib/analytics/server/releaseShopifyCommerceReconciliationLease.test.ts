import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import { SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME } from '@/lib/analytics/server/shopifyCommerceReconciliationTypes'

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
const { releaseShopifyCommerceReconciliationLease } =
  require('./releaseShopifyCommerceReconciliationLease.ts') as typeof import('@/lib/analytics/server/releaseShopifyCommerceReconciliationLease')

const acquiredLease = {
  status: 'acquired' as const,
  jobName: SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME,
  leaseOwner: 'owner-1',
  acquiredAt: '2026-07-01T12:00:00.000Z',
  expiresAt: '2026-07-01T12:15:00.000Z',
  metadata: {
    lastSuccessfulWindowEnd: '2026-07-01T11:00:00.000Z'
  }
}

test('releaseShopifyCommerceReconciliationLease no-ops for non-acquired leases', async () => {
  const result = await releaseShopifyCommerceReconciliationLease(
    {
      lease: {
        status: 'blocked',
        jobName: SHOPIFY_COMMERCE_RECONCILIATION_JOB_NAME,
        leaseOwner: 'other',
        acquiredAt: null,
        expiresAt: null
      }
    }
  )

  assert.deepEqual(result, {
    released: false,
    watermarkAdvanced: false
  })
})

test('releaseShopifyCommerceReconciliationLease gates watermark on lease_owner match', async () => {
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

  const result = await releaseShopifyCommerceReconciliationLease(
    {
      lease: acquiredLease,
      watermark: {
        lastSuccessfulWindowEnd: '2026-07-01T12:00:00.000Z',
        lastSuccessfulRunCompletedAt: '2026-07-01T12:00:10.000Z'
      }
    },
    {
      getSql: () => sql,
      nowIso: () => '2026-07-01T12:00:10.000Z'
    }
  )

  assert.deepEqual(result, {
    released: true,
    watermarkAdvanced: true
  })
  assert.deepEqual(patches[0], {
    releasedAt: '2026-07-01T12:00:10.000Z',
    lastSuccessfulWindowEnd: '2026-07-01T12:00:00.000Z',
    lastSuccessfulRunCompletedAt: '2026-07-01T12:00:10.000Z'
  })
})

test('releaseShopifyCommerceReconciliationLease does not advance watermark when owner mismatch', async () => {
  const sql = Object.assign(async <T>() => [] as unknown as T, {
    json: (value: unknown) => value
  })

  const result = await releaseShopifyCommerceReconciliationLease(
    {
      lease: acquiredLease,
      watermark: {
        lastSuccessfulWindowEnd: '2026-07-01T12:00:00.000Z',
        lastSuccessfulRunCompletedAt: '2026-07-01T12:00:10.000Z'
      }
    },
    { getSql: () => sql }
  )

  assert.deepEqual(result, {
    released: false,
    watermarkAdvanced: false
  })
})

test('releaseShopifyCommerceReconciliationLease does not log raw postgres failures', async () => {
  const logged: unknown[][] = []
  const originalConsoleError = console.error
  console.error = (...args: unknown[]) => {
    logged.push(args)
  }

  try {
    const sql = Object.assign(
      async <T>(): Promise<T> => {
        throw new Error('sensitive_database_error')
      },
      { json: (value: unknown) => value }
    )

    const result =
      await releaseShopifyCommerceReconciliationLease(
        { lease: acquiredLease },
        { getSql: () => sql }
      )

    assert.deepEqual(result, {
      released: false,
      watermarkAdvanced: false
    })
    const serializedLog = logged
      .flat()
      .map(value =>
        value instanceof Error ? value.message : String(value)
      )
      .join(' ')
    assert.equal(
      serializedLog.includes('sensitive_database_error'),
      false
    )
  } finally {
    console.error = originalConsoleError
  }
})
